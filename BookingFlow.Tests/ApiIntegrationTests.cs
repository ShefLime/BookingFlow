using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using BookingFlow.Api.Contract.Admin;
using BookingFlow.Api.Contract.Analytics;
using BookingFlow.Api.Contract.Auth;
using BookingFlow.Api.Contract.Availability;
using BookingFlow.Api.Contract.Booking;
using BookingFlow.Api.Contract.Event;
using BookingFlow.Api.Contract.Organization;
using BookingFlow.Api.Contract.Provider;
using BookingFlow.Api.Contract.ResourceRequest;
using Microsoft.IdentityModel.Tokens;

namespace BookingFlow.Tests;

[TestFixture]
public sealed class ApiIntegrationTests
{
    private const string AdminSubject = "11111111-1111-1111-1111-111111111111";
    private const string ClientSubject = "22222222-2222-2222-2222-222222222222";
    private const string ManagerSubject = "33333333-3333-3333-3333-333333333333";
    private const string ProviderSubject = "44444444-4444-4444-4444-444444444444";

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
    public async Task GetCurrentUser_WithSeededClientToken_ReturnsProvisionedProfile()
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", CreateClientToken());

        var profile = await _client.GetFromJsonAsync<CurrentUserResponse>("/api/auth/me", JsonOptions);

        Assert.That(profile, Is.Not.Null);
        Assert.That(profile!.Email, Is.EqualTo("client@bookingflow.local"));
        Assert.That(profile.KeycloakSubject, Is.EqualTo(ClientSubject));
        Assert.That(profile.Roles.Select(x => x.ToString()), Does.Contain("Client"));
    }

    [Test]
    public async Task GetAdminUsers_WithSeededAdminToken_ReturnsDemoUsers()
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", CreateAdminToken());

        var users = await _client.GetFromJsonAsync<IReadOnlyCollection<AdminUserResponse>>(
            "/api/admin/users",
            JsonOptions);

        Assert.That(users, Is.Not.Null);
        Assert.That(users!.Select(x => x.Email), Does.Contain("admin@bookingflow.local"));
        Assert.That(users.Select(x => x.Email), Does.Contain("provider@bookingflow.local"));
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
        var token = CreateClientToken();
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
        var token = CreateClientToken();
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
        Assert.That(events.First().RemainingCapacity, Is.EqualTo(events.First().Capacity - 2));
    }

    [Test]
    public async Task CancelBooking_LessThan24HoursBeforeStart_ReturnsBadRequest()
    {
        var token = CreateClientToken();
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
        var token = CreateClientToken();
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
        var token = CreateClientToken();
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
        var token = CreateClientToken();
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

    [Test]
    public async Task GetOrganizationAnalytics_WithManagerToken_ReturnsSeededMetrics()
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", CreateManagerToken());
        var fitnessClub = await GetOrganizationByNameAsync("Pulse Fitness Club");

        var analytics = await _client.GetFromJsonAsync<OrganizationAnalyticsResponse>(
            $"/api/organizations/{fitnessClub.Id}/analytics",
            JsonOptions);

        Assert.That(analytics, Is.Not.Null);
        Assert.That(analytics!.HasAccess, Is.True);
        Assert.That(analytics.TotalViews, Is.GreaterThan(0));
        Assert.That(analytics.ExpectedRevenue, Is.GreaterThan(0));
        Assert.That(analytics.StaffLeaderboard, Is.Not.Empty);
        Assert.That(analytics.RetentionCandidates, Is.Not.Empty);
    }

    [Test]
    public async Task GetOrganizationAnalytics_WhenSubscriptionDisabled_ReturnsLockedStateForManager()
    {
        var fitnessClub = await GetOrganizationByNameAsync("Pulse Fitness Club");

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", CreateAdminToken());
        var updateResponse = await _client.PutAsJsonAsync(
            $"/api/organizations/{fitnessClub.Id}/subscription",
            new UpsertOrganizationSubscriptionRequest
            {
                Plan = Domain.Enum.OrganizationSubscriptionPlan.Starter,
                IsAnalyticsEnabled = false,
                StartsAtUtc = DateTimeOffset.UtcNow.AddDays(-1),
                EndsAtUtc = DateTimeOffset.UtcNow.AddDays(30),
                MonthlyPrice = 99,
                Currency = "USD"
            });

        updateResponse.EnsureSuccessStatusCode();

        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", CreateManagerToken());
        var analytics = await _client.GetFromJsonAsync<OrganizationAnalyticsResponse>(
            $"/api/organizations/{fitnessClub.Id}/analytics",
            JsonOptions);

        Assert.That(analytics, Is.Not.Null);
        Assert.That(analytics!.HasAccess, Is.False);
        Assert.That(analytics.AccessMessage, Does.Contain("subscription"));
    }

    [Test]
    public async Task ReviewProviderJoinRequest_WithManagerToken_ApprovesRequestAndCreatesAffiliation()
    {
        var fitnessClub = await GetOrganizationByNameAsync("Pulse Fitness Club");
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", CreateManagerToken());

        var requests = await _client.GetFromJsonAsync<IReadOnlyCollection<ProviderOrganizationJoinRequestResponse>>(
            $"/api/organizations/{fitnessClub.Id}/provider-join-requests",
            JsonOptions);

        Assert.That(requests, Is.Not.Null);
        var pendingRequest = requests!.Single(x => x.Status.ToString() == "Pending");

        var reviewResponse = await _client.PostAsJsonAsync(
            $"/api/organizations/{fitnessClub.Id}/provider-join-requests/{pendingRequest.Id}/review",
            new ReviewProviderOrganizationJoinRequestRequest
            {
                Status = Domain.Enum.ProviderOrganizationJoinRequestStatus.Approved,
                Title = "Resident Provider",
                IsPrimary = false,
                Note = "Approved for the demo"
            });

        reviewResponse.EnsureSuccessStatusCode();
        var updatedRequest = await reviewResponse.Content.ReadFromJsonAsync<ProviderOrganizationJoinRequestResponse>(JsonOptions);

        Assert.That(updatedRequest, Is.Not.Null);
        Assert.That(updatedRequest!.Status.ToString(), Is.EqualTo("Approved"));
        Assert.That(updatedRequest.Affiliation, Is.Not.Null);
        Assert.That(updatedRequest.Affiliation!.OrganizationId, Is.EqualTo(fitnessClub.Id));
    }

    private static string CreateClientToken()
    {
        return CreateToken(
            ClientSubject,
            "client@bookingflow.local",
            "Demo",
            "Client",
            Array.Empty<string>());
    }

    private static string CreateManagerToken()
    {
        return CreateToken(
            ManagerSubject,
            "manager@bookingflow.local",
            "Sofia",
            "Manager",
            new[] { "Manager" });
    }

    private static string CreateAdminToken()
    {
        return CreateToken(
            AdminSubject,
            "admin@bookingflow.local",
            "System",
            "Admin",
            new[] { "Admin" });
    }

    private static string CreateToken(
        string subject,
        string email,
        string firstName,
        string lastName,
        IReadOnlyCollection<string> roles)
    {
        var claims = new List<Claim>
        {
            new("sub", subject),
            new("email", email),
            new("given_name", firstName),
            new("family_name", lastName)
        };

        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("bookingflow-tests-signing-key-please-change"));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: "BookingFlow.Tests",
            audience: "BookingFlow.Tests.Client",
            claims: claims,
            notBefore: DateTime.UtcNow.AddMinutes(-1),
            expires: DateTime.UtcNow.AddHours(2),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
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
