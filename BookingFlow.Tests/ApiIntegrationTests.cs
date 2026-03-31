using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using BookingFlow.Api.Contract.Auth;
using BookingFlow.Api.Contract.Availability;
using BookingFlow.Api.Contract.Booking;
using BookingFlow.Api.Contract.Event;
using BookingFlow.Api.Contract.Organization;
using BookingFlow.Api.Contract.ResourceRequest;

namespace BookingFlow.Tests;

[TestFixture]
public sealed class ApiIntegrationTests
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    private BookingFlowApiFactory _factory = null!;
    private HttpClient _client = null!;

    [SetUp]
    public void SetUp()
    {
        _factory = new BookingFlowApiFactory();
        _client = _factory.CreateClient();
    }

    [TearDown]
    public void TearDown()
    {
        _client.Dispose();
        _factory.Dispose();
    }

    [Test]
    public async Task GetOrganizations_ReturnsSeededOrganizations()
    {
        var organizations = await _client.GetFromJsonAsync<IReadOnlyCollection<OrganizationResponse>>(
            "/api/organizations",
            JsonOptions);

        Assert.That(organizations, Is.Not.Null);
        Assert.That(organizations!, Has.Count.EqualTo(2));
        Assert.That(organizations.Select(x => x.Name), Does.Contain("Harbor Bar"));
        Assert.That(organizations.Select(x => x.Name), Does.Contain("Pulse Fitness Club"));
    }

    [Test]
    public async Task Login_WithSeededClient_ReturnsJwtToken()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Email = "client@bookingflow.local",
            Password = "Client123!"
        });

        response.EnsureSuccessStatusCode();

        var authResponse = await response.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);

        Assert.That(authResponse, Is.Not.Null);
        Assert.That(authResponse!.AccessToken, Is.Not.Empty);
        Assert.That(authResponse.Role, Is.EqualTo("Client"));
        Assert.That(authResponse.Email, Is.EqualTo("client@bookingflow.local"));
    }

    [Test]
    public async Task GetAvailability_ForSeededTable_ReturnsAvailableFutureSlots()
    {
        var (_, table) = await GetBarAndTableAsync();
        var targetDate = await GetNextAvailableDateAsync(table.Id);

        var slots = await _client.GetFromJsonAsync<IReadOnlyCollection<AvailableSlotResponse>>(
            $"/api/resources/{table.Id}/availability?date={targetDate:yyyy-MM-dd}",
            JsonOptions);

        Assert.That(slots, Is.Not.Null);
        Assert.That(slots!, Is.Not.Empty);
        Assert.That(slots.All(x => x.OrganizationTimeZone == "Asia/Ho_Chi_Minh"), Is.True);
        Assert.That(slots.Any(x => x.IsAvailable), Is.True);
    }

    [Test]
    public async Task CreateResourceBooking_WithAuthorizedClient_CreatesBooking()
    {
        var token = await LoginAsClientAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var (bar, table) = await GetBarAndTableAsync();
        var slot = await GetFirstAvailableSlotAsync(table.Id);

        var createResponse = await _client.PostAsJsonAsync("/api/bookings/resources", new CreateBookingRequest
        {
            OrganizationId = bar.Id,
            ResourceId = table.Id,
            StartAtUtc = slot.StartAtUtc,
            EndAtUtc = slot.EndAtUtc,
            GuestCount = 2,
            Comment = "Integration test booking"
        });

        createResponse.EnsureSuccessStatusCode();

        var booking = await createResponse.Content.ReadFromJsonAsync<BookingResponse>(JsonOptions);
        var myBookings = await _client.GetFromJsonAsync<IReadOnlyCollection<BookingResponse>>("/api/bookings/my", JsonOptions);

        Assert.That(booking, Is.Not.Null);
        Assert.That(booking!.OrganizationName, Is.EqualTo("Harbor Bar"));
        Assert.That(booking.ResourceName, Is.EqualTo("Table 1"));
        Assert.That(booking.GuestCount, Is.EqualTo(2));
        Assert.That(myBookings, Is.Not.Null);
        Assert.That(myBookings!.Any(x => x.Id == booking.Id), Is.True);
    }

    [Test]
    public async Task CreateResourceBooking_ForAlreadyBookedSlot_ReturnsBadRequest()
    {
        var token = await LoginAsClientAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var (bar, table) = await GetBarAndTableAsync();
        var slot = await GetFirstAvailableSlotAsync(table.Id);

        var request = new CreateBookingRequest
        {
            OrganizationId = bar.Id,
            ResourceId = table.Id,
            StartAtUtc = slot.StartAtUtc,
            EndAtUtc = slot.EndAtUtc,
            GuestCount = 2,
            Comment = "First booking"
        };

        var firstResponse = await _client.PostAsJsonAsync("/api/bookings/resources", request);
        firstResponse.EnsureSuccessStatusCode();

        var secondResponse = await _client.PostAsJsonAsync("/api/bookings/resources", request);

        Assert.That(secondResponse.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
        var errorPayload = await secondResponse.Content.ReadAsStringAsync();
        Assert.That(errorPayload, Does.Contain("already booked"));
    }

    [Test]
    public async Task GetEvents_ReturnsSeededEventWithRemainingCapacity()
    {
        var bar = await GetOrganizationByNameAsync("Harbor Bar");

        var events = await _client.GetFromJsonAsync<IReadOnlyCollection<EventResponse>>(
            $"/api/organizations/{bar.Id}/events",
            JsonOptions);

        Assert.That(events, Is.Not.Null);
        Assert.That(events!, Has.Count.EqualTo(1));
        Assert.That(events.First().Name, Is.EqualTo("Friday Jazz Night"));
        Assert.That(events.First().RemainingCapacity, Is.EqualTo(events.First().Capacity));
    }

    [Test]
    public async Task CancelBooking_LessThan24HoursBeforeStart_ReturnsBadRequest()
    {
        var token = await LoginAsClientAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var booking = await CreateBookingAsync();
        var closeToStart = booking.StartAtUtc.AddHours(-23);

        using var scope = new TimeOverride(closeToStart);
        var response = await _client.PostAsJsonAsync(
            $"/api/bookings/{booking.Id}/cancel",
            new CancelBookingRequest { Reason = "Too late" });

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
        var payload = await response.Content.ReadAsStringAsync();
        Assert.That(payload, Does.Contain("24 hours"));
    }

    [Test]
    public async Task CancelBooking_MoreThan24HoursBeforeStart_Succeeds()
    {
        var token = await LoginAsClientAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var booking = await CreateBookingAsync();

        var response = await _client.PostAsJsonAsync(
            $"/api/bookings/{booking.Id}/cancel",
            new CancelBookingRequest { Reason = "Plans changed" });

        response.EnsureSuccessStatusCode();
        var cancelledBooking = await response.Content.ReadFromJsonAsync<BookingResponse>(JsonOptions);

        Assert.That(cancelledBooking, Is.Not.Null);
        Assert.That(cancelledBooking!.Status.ToString(), Is.EqualTo("Cancelled"));
    }

    [Test]
    public async Task RescheduleBooking_LessThan24HoursBeforeStart_ReturnsBadRequest()
    {
        var token = await LoginAsClientAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var booking = await CreateBookingAsync();
        var closeToStart = booking.StartAtUtc.AddHours(-23);

        using var scope = new TimeOverride(closeToStart);
        var response = await _client.PostAsJsonAsync(
            $"/api/bookings/{booking.Id}/reschedule",
            new RescheduleBookingRequest
            {
                NewStartAtUtc = booking.StartAtUtc.AddDays(1),
                NewEndAtUtc = booking.EndAtUtc.AddDays(1)
            });

        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
        var payload = await response.Content.ReadAsStringAsync();
        Assert.That(payload, Does.Contain("24 hours"));
    }

    [Test]
    public async Task RescheduleBooking_MoreThan24HoursBeforeStart_Succeeds()
    {
        var token = await LoginAsClientAsync();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var booking = await CreateBookingAsync();
        var rescheduleSlot = await GetAlternativeAvailableSlotAsync(booking.ResourceId!.Value, booking.StartAtUtc);

        var response = await _client.PostAsJsonAsync(
            $"/api/bookings/{booking.Id}/reschedule",
            new RescheduleBookingRequest
            {
                NewStartAtUtc = rescheduleSlot.StartAtUtc,
                NewEndAtUtc = rescheduleSlot.EndAtUtc
            });

        response.EnsureSuccessStatusCode();
        var updatedBooking = await response.Content.ReadFromJsonAsync<BookingResponse>(JsonOptions);

        Assert.That(updatedBooking, Is.Not.Null);
        Assert.That(updatedBooking!.StartAtUtc, Is.EqualTo(rescheduleSlot.StartAtUtc));
        Assert.That(updatedBooking.EndAtUtc, Is.EqualTo(rescheduleSlot.EndAtUtc));
    }

    private async Task<string> LoginAsClientAsync()
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest
        {
            Email = "client@bookingflow.local",
            Password = "Client123!"
        });

        response.EnsureSuccessStatusCode();

        var authResponse = await response.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        return authResponse!.AccessToken;
    }

    private async Task<(OrganizationResponse Bar, ResourceResponse Table)> GetBarAndTableAsync()
    {
        var bar = await GetOrganizationByNameAsync("Harbor Bar");

        var resources = await _client.GetFromJsonAsync<IReadOnlyCollection<ResourceResponse>>(
            $"/api/organizations/{bar.Id}/resources",
            JsonOptions);

        Assert.That(resources, Is.Not.Null);

        var table = resources!.Single(x => x.Name == "Table 1");
        return (bar, table);
    }

    private async Task<OrganizationResponse> GetOrganizationByNameAsync(string name)
    {
        var organizations = await _client.GetFromJsonAsync<IReadOnlyCollection<OrganizationResponse>>(
            "/api/organizations",
            JsonOptions);

        Assert.That(organizations, Is.Not.Null);
        return organizations!.Single(x => x.Name == name);
    }

    private async Task<AvailableSlotResponse> GetFirstAvailableSlotAsync(Guid resourceId)
    {
        var targetDate = await GetNextAvailableDateAsync(resourceId);
        var slots = await _client.GetFromJsonAsync<IReadOnlyCollection<AvailableSlotResponse>>(
            $"/api/resources/{resourceId}/availability?date={targetDate:yyyy-MM-dd}",
            JsonOptions);

        Assert.That(slots, Is.Not.Null);
        var availableSlot = slots!.FirstOrDefault(x => x.IsAvailable);
        Assert.That(availableSlot, Is.Not.Null, "Expected at least one available slot.");
        return availableSlot!;
    }

    private async Task<AvailableSlotResponse> GetAlternativeAvailableSlotAsync(Guid resourceId, DateTimeOffset currentStartAtUtc)
    {
        var targetDate = await GetNextAvailableDateAsync(resourceId);
        var slots = await _client.GetFromJsonAsync<IReadOnlyCollection<AvailableSlotResponse>>(
            $"/api/resources/{resourceId}/availability?date={targetDate:yyyy-MM-dd}",
            JsonOptions);

        Assert.That(slots, Is.Not.Null);
        var alternative = slots!
            .FirstOrDefault(x => x.IsAvailable && x.StartAtUtc != currentStartAtUtc);

        if (alternative is not null)
        {
            return alternative;
        }

        var fallbackDate = targetDate.AddDays(1);
        var fallbackSlots = await _client.GetFromJsonAsync<IReadOnlyCollection<AvailableSlotResponse>>(
            $"/api/resources/{resourceId}/availability?date={fallbackDate:yyyy-MM-dd}",
            JsonOptions);

        Assert.That(fallbackSlots, Is.Not.Null);
        var fallback = fallbackSlots!.FirstOrDefault(x => x.IsAvailable);
        Assert.That(fallback, Is.Not.Null, "Expected an alternative slot for rescheduling.");
        return fallback!;
    }

    private async Task<DateOnly> GetNextAvailableDateAsync(Guid resourceId)
    {
        for (var offset = 2; offset <= 14; offset++)
        {
            var date = DateOnly.FromDateTime(DateTime.UtcNow.Date.AddDays(offset));
            var slots = await _client.GetFromJsonAsync<IReadOnlyCollection<AvailableSlotResponse>>(
                $"/api/resources/{resourceId}/availability?date={date:yyyy-MM-dd}",
                JsonOptions);

            if (slots is not null && slots.Any(x => x.IsAvailable))
            {
                return date;
            }
        }

        Assert.Fail("Expected to find at least one available slot in the next 14 days.");
        return default;
    }

    private async Task<BookingResponse> CreateBookingAsync()
    {
        var (bar, table) = await GetBarAndTableAsync();
        var slot = await GetFirstAvailableSlotAsync(table.Id);

        var createResponse = await _client.PostAsJsonAsync("/api/bookings/resources", new CreateBookingRequest
        {
            OrganizationId = bar.Id,
            ResourceId = table.Id,
            StartAtUtc = slot.StartAtUtc,
            EndAtUtc = slot.EndAtUtc,
            GuestCount = 2,
            Comment = "Reusable booking"
        });

        createResponse.EnsureSuccessStatusCode();
        var booking = await createResponse.Content.ReadFromJsonAsync<BookingResponse>(JsonOptions);
        Assert.That(booking, Is.Not.Null);
        return booking!;
    }

    private sealed class TimeOverride : IDisposable
    {
        private readonly string? _previousValue;

        public TimeOverride(DateTimeOffset value)
        {
            _previousValue = Environment.GetEnvironmentVariable("BOOKINGFLOW_OVERRIDE_UTC_NOW");
            Environment.SetEnvironmentVariable("BOOKINGFLOW_OVERRIDE_UTC_NOW", value.ToString("O"));
        }

        public void Dispose()
        {
            Environment.SetEnvironmentVariable("BOOKINGFLOW_OVERRIDE_UTC_NOW", _previousValue);
        }
    }
}
