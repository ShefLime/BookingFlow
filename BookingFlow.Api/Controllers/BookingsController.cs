using BookingFlow.Api.Contract.Booking;
using BookingFlow.Api.Data;
using BookingFlow.Api.Extensions;
using BookingFlow.Api.Services;
using BookingFlow.Domain.Entity;
using BookingFlow.Domain.Enum;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookingFlow.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/bookings")]
public sealed class BookingsController(
    ApplicationDbContext dbContext,
    AvailabilityService availabilityService) : ControllerBase
{
    private static readonly TimeSpan BookingChangeCutoff = TimeSpan.FromHours(24);

    private readonly ApplicationDbContext _dbContext = dbContext;
    private readonly AvailabilityService _availabilityService = availabilityService;

    [HttpPost("resources")]
    public async Task<ActionResult<BookingResponse>> CreateResourceBooking(
        CreateBookingRequest request,
        CancellationToken cancellationToken)
    {
        if (request.GuestCount < 1)
        {
            return BadRequest(new { message = "GuestCount must be at least 1." });
        }

        var resource = await _dbContext.Resources
            .Include(x => x.Organization)
            .Include(x => x.ProviderProfile)
            .Include(x => x.AvailabilityRules)
            .SingleOrDefaultAsync(x => x.Id == request.ResourceId, cancellationToken);

        if (resource is null || !resource.IsActive)
        {
            return NotFound(new { message = "Resource was not found or is inactive." });
        }

        if (resource.OrganizationId.HasValue)
        {
            if (resource.Organization is null || !resource.Organization.IsActive)
            {
                return NotFound(new { message = "Resource was not found or is inactive." });
            }

            if (resource.OrganizationId != request.OrganizationId)
            {
                return BadRequest(new { message = "Organization id does not match the selected resource." });
            }
        }
        else
        {
            if (request.OrganizationId.HasValue)
            {
                return BadRequest(new { message = "Provider-owned resources do not require an organization id." });
            }

            if (resource.ProviderProfile is null || resource.ProviderProfile.ApprovalStatus != ModerationStatus.Approved)
            {
                return NotFound(new { message = "Resource was not found or is inactive." });
            }
        }

        if (request.GuestCount > resource.Capacity)
        {
            return BadRequest(new { message = $"This resource allows up to {resource.Capacity} guests." });
        }

        var validationError = await _availabilityService.ValidateResourceBookingAsync(
            resource,
            request.StartAtUtc.ToUniversalTime(),
            request.EndAtUtc.ToUniversalTime(),
            cancellationToken: cancellationToken);

        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        var userId = User.GetRequiredUserId();
        var booking = new Booking
        {
            UserId = userId,
            OrganizationId = resource.OrganizationId,
            ProviderProfileId = resource.ProviderProfileId,
            ResourceId = resource.Id,
            StartAtUtc = request.StartAtUtc.ToUniversalTime(),
            EndAtUtc = request.EndAtUtc.ToUniversalTime(),
            GuestCount = request.GuestCount,
            Comment = request.Comment?.Trim(),
            Status = BookingStatus.Confirmed,
            Price = resource.PriceFrom,
            Currency = resource.PriceFrom.HasValue ? "USD" : null,
            ConfirmedAtUtc = DateTimeOffset.UtcNow
        };

        _dbContext.Bookings.Add(booking);
        await _dbContext.SaveChangesAsync(cancellationToken);

        booking.Organization = resource.Organization;
        booking.ProviderProfile = resource.ProviderProfile;
        booking.Resource = resource;

        return CreatedAtAction(nameof(GetMyBookingById), new { bookingId = booking.Id }, ToResponse(booking));
    }

    [HttpPost("events")]
    public async Task<ActionResult<BookingResponse>> CreateEventBooking(
        CreateEventBookingRequest request,
        CancellationToken cancellationToken)
    {
        if (request.GuestCount < 1)
        {
            return BadRequest(new { message = "GuestCount must be at least 1." });
        }

        var eventSession = await _dbContext.EventSessions
            .Include(x => x.Organization)
            .SingleOrDefaultAsync(x => x.Id == request.EventSessionId, cancellationToken);

        if (eventSession is null || !eventSession.IsActive || !eventSession.Organization.IsActive)
        {
            return NotFound(new { message = "Event was not found or is inactive." });
        }

        if (eventSession.OrganizationId != request.OrganizationId)
        {
            return BadRequest(new { message = "Organization id does not match the selected event." });
        }

        if (eventSession.StartAtUtc < DateTimeOffset.UtcNow)
        {
            return BadRequest(new { message = "You cannot book an event that already started." });
        }

        var reservedGuests = await _dbContext.Bookings
            .AsNoTracking()
            .Where(x =>
                x.EventSessionId == eventSession.Id &&
                x.Status != BookingStatus.Cancelled &&
                x.Status != BookingStatus.Expired)
            .SumAsync(x => (int?)x.GuestCount, cancellationToken) ?? 0;

        if (reservedGuests + request.GuestCount > eventSession.Capacity)
        {
            return BadRequest(new { message = "There are not enough seats available for this event." });
        }

        var booking = new Booking
        {
            UserId = User.GetRequiredUserId(),
            OrganizationId = eventSession.OrganizationId,
            EventSessionId = eventSession.Id,
            StartAtUtc = eventSession.StartAtUtc,
            EndAtUtc = eventSession.EndAtUtc,
            GuestCount = request.GuestCount,
            Comment = request.Comment?.Trim(),
            Status = BookingStatus.Confirmed,
            ConfirmedAtUtc = DateTimeOffset.UtcNow
        };

        _dbContext.Bookings.Add(booking);
        await _dbContext.SaveChangesAsync(cancellationToken);

        booking.Organization = eventSession.Organization;
        booking.EventSession = eventSession;

        return CreatedAtAction(nameof(GetMyBookingById), new { bookingId = booking.Id }, ToResponse(booking));
    }

    [HttpGet("my")]
    public async Task<ActionResult<IReadOnlyCollection<BookingResponse>>> GetMyBookings(CancellationToken cancellationToken)
    {
        var userId = User.GetRequiredUserId();

        var bookings = await _dbContext.Bookings
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Include(x => x.Organization)
            .Include(x => x.ProviderProfile)
            .Include(x => x.Resource)
            .Include(x => x.EventSession)
            .ToListAsync(cancellationToken);

        return Ok(bookings
            .OrderByDescending(x => x.StartAtUtc)
            .Select(ToResponse)
            .ToList());
    }

    [HttpGet("{bookingId:guid}")]
    public async Task<ActionResult<BookingResponse>> GetMyBookingById(Guid bookingId, CancellationToken cancellationToken)
    {
        var booking = await LoadOwnedBookingAsync(bookingId, cancellationToken);
        return booking is null ? NotFound() : Ok(ToResponse(booking));
    }

    [HttpPost("{bookingId:guid}/cancel")]
    public async Task<ActionResult<BookingResponse>> CancelBooking(
        Guid bookingId,
        CancelBookingRequest request,
        CancellationToken cancellationToken)
    {
        var booking = await LoadOwnedBookingAsync(bookingId, cancellationToken);
        if (booking is null)
        {
            return NotFound();
        }

        if (booking.Status == BookingStatus.Cancelled)
        {
            return BadRequest(new { message = "Booking is already cancelled." });
        }

        if (booking.StartAtUtc - BookingFlowClock.UtcNow < BookingChangeCutoff)
        {
            return BadRequest(new { message = "Bookings can only be cancelled at least 24 hours before start time." });
        }

        booking.Status = BookingStatus.Cancelled;
        booking.CancellationReason = request.Reason?.Trim();
        booking.CancelledAtUtc = BookingFlowClock.UtcNow;
        booking.UpdatedAtUtc = BookingFlowClock.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(ToResponse(booking));
    }

    [HttpPost("{bookingId:guid}/reschedule")]
    public async Task<ActionResult<BookingResponse>> RescheduleBooking(
        Guid bookingId,
        RescheduleBookingRequest request,
        CancellationToken cancellationToken)
    {
        var booking = await LoadOwnedBookingAsync(bookingId, cancellationToken);
        if (booking is null)
        {
            return NotFound();
        }

        if (booking.ResourceId is null || booking.Resource is null)
        {
            return BadRequest(new { message = "Only resource bookings can be rescheduled." });
        }

        if (booking.Status == BookingStatus.Cancelled)
        {
            return BadRequest(new { message = "Cancelled bookings cannot be rescheduled." });
        }

        if (booking.StartAtUtc - BookingFlowClock.UtcNow < BookingChangeCutoff)
        {
            return BadRequest(new { message = "Bookings can only be rescheduled at least 24 hours before start time." });
        }

        if (request.NewStartAtUtc.ToUniversalTime() - BookingFlowClock.UtcNow < BookingChangeCutoff)
        {
            return BadRequest(new { message = "New booking time must be at least 24 hours in the future." });
        }

        var validationError = await _availabilityService.ValidateResourceBookingAsync(
            booking.Resource,
            request.NewStartAtUtc.ToUniversalTime(),
            request.NewEndAtUtc.ToUniversalTime(),
            booking.Id,
            cancellationToken);

        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        booking.StartAtUtc = request.NewStartAtUtc.ToUniversalTime();
        booking.EndAtUtc = request.NewEndAtUtc.ToUniversalTime();
        booking.UpdatedAtUtc = BookingFlowClock.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(ToResponse(booking));
    }

    private async Task<Booking?> LoadOwnedBookingAsync(Guid bookingId, CancellationToken cancellationToken)
    {
        var userId = User.GetRequiredUserId();

        return await _dbContext.Bookings
            .Include(x => x.Organization)
            .Include(x => x.ProviderProfile)
            .Include(x => x.Resource)
            .ThenInclude(x => x!.Organization)
            .Include(x => x.Resource)
            .ThenInclude(x => x!.ProviderProfile)
            .Include(x => x.Resource)
            .ThenInclude(x => x!.AvailabilityRules)
            .Include(x => x.EventSession)
            .SingleOrDefaultAsync(x => x.Id == bookingId && x.UserId == userId, cancellationToken);
    }

    private static BookingResponse ToResponse(Booking booking)
    {
        return new BookingResponse
        {
            Id = booking.Id,
            UserId = booking.UserId,
            OrganizationId = booking.OrganizationId,
            OrganizationName = booking.Organization?.Name,
            ProviderProfileId = booking.ProviderProfileId,
            ProviderDisplayName = booking.ProviderProfile?.DisplayName,
            ResourceId = booking.ResourceId,
            ResourceName = booking.Resource?.Name,
            EventSessionId = booking.EventSessionId,
            EventName = booking.EventSession?.Name,
            StartAtUtc = booking.StartAtUtc,
            EndAtUtc = booking.EndAtUtc,
            GuestCount = booking.GuestCount,
            Status = booking.Status,
            Comment = booking.Comment,
            CancellationReason = booking.CancellationReason,
            Price = booking.Price,
            Currency = booking.Currency,
            ConfirmedAtUtc = booking.ConfirmedAtUtc,
            CancelledAtUtc = booking.CancelledAtUtc
        };
    }
}
