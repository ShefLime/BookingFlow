using BookingFlow.Api.Contract.Availability;
using BookingFlow.Api.Data;
using BookingFlow.Domain.Entity;
using BookingFlow.Domain.Enum;
using Microsoft.EntityFrameworkCore;

namespace BookingFlow.Api.Services;

public sealed class AvailabilityService(ApplicationDbContext dbContext)
{
    private readonly ApplicationDbContext _dbContext = dbContext;

    public async Task<IReadOnlyCollection<AvailableSlotResponse>> GetAvailabilityAsync(
        Guid resourceId,
        DateOnly date,
        CancellationToken cancellationToken = default)
    {
        var resource = await _dbContext.Resources
            .AsNoTracking()
            .Include(x => x.Organization)
            .Include(x => x.ProviderProfile)
            .Include(x => x.AvailabilityRules)
            .SingleOrDefaultAsync(x => x.Id == resourceId, cancellationToken);

        if (resource is null || !resource.IsActive)
        {
            return Array.Empty<AvailableSlotResponse>();
        }

        var ownerTimeZoneId = resource.Organization?.TimeZone ?? resource.ProviderProfile?.TimeZone;
        if (resource.OrganizationId.HasValue && (resource.Organization is null || !resource.Organization.IsActive))
        {
            return Array.Empty<AvailableSlotResponse>();
        }

        if (resource.ProviderProfileId.HasValue && resource.ProviderProfile?.ApprovalStatus != ModerationStatus.Approved)
        {
            return Array.Empty<AvailableSlotResponse>();
        }

        var rules = resource.AvailabilityRules
            .Where(x => x.IsActive && x.DayOfWeek == date.DayOfWeek)
            .OrderBy(x => x.StartTime)
            .ToList();

        if (rules.Count == 0)
        {
            return Array.Empty<AvailableSlotResponse>();
        }

        var timeZone = ResolveTimeZone(ownerTimeZoneId);
        var utcDayStart = ConvertLocalToUtc(date, TimeSpan.Zero, timeZone);
        var utcDayEnd = ConvertLocalToUtc(date.AddDays(1), TimeSpan.Zero, timeZone);

        var bookings = await _dbContext.Bookings
            .AsNoTracking()
            .Where(x =>
                x.ResourceId == resourceId &&
                x.Status != BookingStatus.Cancelled &&
                x.Status != BookingStatus.Expired)
            .Select(x => new { x.StartAtUtc, x.EndAtUtc })
            .ToListAsync(cancellationToken);

        bookings = bookings
            .Where(x => x.StartAtUtc < utcDayEnd && x.EndAtUtc > utcDayStart)
            .ToList();

        var slotDuration = TimeSpan.FromMinutes(resource.SlotSizeMinutes);
        var slots = new List<AvailableSlotResponse>();

        foreach (var rule in rules)
        {
            for (var cursor = rule.StartTime; cursor + slotDuration <= rule.EndTime; cursor += slotDuration)
            {
                var slotStartAtUtc = ConvertLocalToUtc(date, cursor, timeZone);
                var slotEndAtUtc = ConvertLocalToUtc(date, cursor + slotDuration, timeZone);
                var isBusy = bookings.Any(x => x.StartAtUtc < slotEndAtUtc && x.EndAtUtc > slotStartAtUtc);

                slots.Add(new AvailableSlotResponse
                {
                    StartAtUtc = slotStartAtUtc,
                    EndAtUtc = slotEndAtUtc,
                    IsAvailable = !isBusy && slotStartAtUtc >= DateTimeOffset.UtcNow,
                    OrganizationTimeZone = ownerTimeZoneId ?? "UTC"
                });
            }
        }

        return slots;
    }

    public async Task<string?> ValidateResourceBookingAsync(
        Resource resource,
        DateTimeOffset startAtUtc,
        DateTimeOffset endAtUtc,
        Guid? ignoredBookingId = null,
        CancellationToken cancellationToken = default)
    {
        if (startAtUtc >= endAtUtc)
        {
            return "StartAtUtc must be earlier than EndAtUtc.";
        }

        if (startAtUtc < DateTimeOffset.UtcNow)
        {
            return "You cannot create a booking in the past.";
        }

        var durationMinutes = (endAtUtc - startAtUtc).TotalMinutes;
        if (durationMinutes < resource.SlotSizeMinutes || durationMinutes % resource.SlotSizeMinutes != 0)
        {
            return $"Booking duration must be a multiple of {resource.SlotSizeMinutes} minutes.";
        }

        var timeZone = ResolveTimeZone(resource.Organization?.TimeZone ?? resource.ProviderProfile?.TimeZone);
        var localStart = TimeZoneInfo.ConvertTime(startAtUtc, timeZone);
        var localEnd = TimeZoneInfo.ConvertTime(endAtUtc, timeZone);

        if (localStart.Date != localEnd.Date)
        {
            return "Booking must be inside a single owner local day.";
        }

        var isInsideAvailability = resource.AvailabilityRules
            .Any(x =>
                x.IsActive &&
                x.DayOfWeek == localStart.DayOfWeek &&
                localStart.TimeOfDay >= x.StartTime &&
                localEnd.TimeOfDay <= x.EndTime);

        if (!isInsideAvailability)
        {
            return "Requested time is outside the resource availability.";
        }

        var overlaps = (await _dbContext.Bookings
                .AsNoTracking()
                .Where(x =>
                    x.ResourceId == resource.Id &&
                    x.Id != ignoredBookingId &&
                    x.Status != BookingStatus.Cancelled &&
                    x.Status != BookingStatus.Expired)
                .Select(x => new { x.StartAtUtc, x.EndAtUtc })
                .ToListAsync(cancellationToken))
            .Any(x => x.StartAtUtc < endAtUtc && x.EndAtUtc > startAtUtc);

        return overlaps ? "This slot is already booked." : null;
    }

    public static TimeZoneInfo ResolveTimeZone(string? timeZoneId)
    {
        if (string.IsNullOrWhiteSpace(timeZoneId))
        {
            return TimeZoneInfo.Utc;
        }

        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);
        }
        catch (TimeZoneNotFoundException)
        {
            return TimeZoneInfo.Utc;
        }
        catch (InvalidTimeZoneException)
        {
            return TimeZoneInfo.Utc;
        }
    }

    private static DateTimeOffset ConvertLocalToUtc(DateOnly date, TimeSpan time, TimeZoneInfo timeZone)
    {
        var localDateTime = date.ToDateTime(TimeOnly.FromTimeSpan(time), DateTimeKind.Unspecified);
        var utcDateTime = TimeZoneInfo.ConvertTimeToUtc(localDateTime, timeZone);
        return new DateTimeOffset(utcDateTime);
    }
}
