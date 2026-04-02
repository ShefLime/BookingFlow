using System.Security.Claims;
using BookingFlow.Api.Contract.Analytics;
using BookingFlow.Api.Contract.Organization;
using BookingFlow.Api.Contract.Provider;
using BookingFlow.Api.Data;
using BookingFlow.Api.Extensions;
using BookingFlow.Domain.Entity;
using BookingFlow.Domain.Enum;
using Microsoft.EntityFrameworkCore;

namespace BookingFlow.Api.Services;

public sealed class OrganizationAnalyticsService(ApplicationDbContext dbContext)
{
    private const int ReturnWindowDays = 30;
    private readonly ApplicationDbContext _dbContext = dbContext;

    public async Task<bool> TrackViewAsync(
        TrackAnalyticsViewRequest request,
        ClaimsPrincipal? principal,
        string? userAgent,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.VisitorId))
        {
            return false;
        }

        Guid? userId = null;
        if (principal?.Identity?.IsAuthenticated == true)
        {
            userId = principal.GetRequiredUserId();
        }

        var analyticsEvent = new AnalyticsEvent
        {
            EventType = AnalyticsEventType.PageView,
            EntityType = request.EntityType,
            VisitorId = request.VisitorId.Trim(),
            Path = request.Path?.Trim(),
            Referrer = request.Referrer?.Trim(),
            UserAgent = string.IsNullOrWhiteSpace(userAgent) ? null : userAgent.Trim(),
            UserId = userId,
            OccurredAtUtc = BookingFlowClock.UtcNow
        };

        switch (request.EntityType)
        {
            case AnalyticsEntityType.Organization:
            {
                var organization = await _dbContext.Organizations
                    .AsNoTracking()
                    .SingleOrDefaultAsync(x => x.Id == request.EntityId && x.IsActive, cancellationToken);

                if (organization is null)
                {
                    return false;
                }

                analyticsEvent.OrganizationId = organization.Id;
                break;
            }
            case AnalyticsEntityType.Resource:
            {
                var resource = await _dbContext.Resources
                    .AsNoTracking()
                    .Include(x => x.Organization)
                    .Include(x => x.ProviderProfile)
                    .SingleOrDefaultAsync(x => x.Id == request.EntityId && x.IsActive, cancellationToken);

                if (resource is null)
                {
                    return false;
                }

                if (resource.OrganizationId.HasValue && (resource.Organization is null || !resource.Organization.IsActive))
                {
                    return false;
                }

                if (resource.ProviderProfileId.HasValue &&
                    (resource.ProviderProfile is null || resource.ProviderProfile.ApprovalStatus != ModerationStatus.Approved))
                {
                    return false;
                }

                analyticsEvent.OrganizationId = resource.OrganizationId;
                analyticsEvent.ResourceId = resource.Id;
                break;
            }
            case AnalyticsEntityType.EventSession:
            {
                var eventSession = await _dbContext.EventSessions
                    .AsNoTracking()
                    .Include(x => x.Organization)
                    .SingleOrDefaultAsync(x => x.Id == request.EntityId && x.IsActive, cancellationToken);

                if (eventSession is null || !eventSession.Organization.IsActive)
                {
                    return false;
                }

                analyticsEvent.OrganizationId = eventSession.OrganizationId;
                analyticsEvent.EventSessionId = eventSession.Id;
                break;
            }
            default:
                return false;
        }

        _dbContext.AnalyticsEvents.Add(analyticsEvent);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<OrganizationSubscription?> GetSubscriptionEntityAsync(
        Guid organizationId,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.OrganizationSubscriptions
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.OrganizationId == organizationId, cancellationToken);
    }

    public async Task<OrganizationAnalyticsResponse> GetOrganizationAnalyticsAsync(
        Guid organizationId,
        DateTimeOffset fromUtc,
        DateTimeOffset toUtc,
        int forecastDays,
        CancellationToken cancellationToken = default)
    {
        var normalizedFromUtc = fromUtc.ToUniversalTime();
        var normalizedToUtc = toUtc.ToUniversalTime();
        if (normalizedToUtc < normalizedFromUtc)
        {
            (normalizedFromUtc, normalizedToUtc) = (normalizedToUtc, normalizedFromUtc);
        }

        forecastDays = Math.Clamp(forecastDays, 1, 180);
        var now = BookingFlowClock.UtcNow;
        var forecastToUtc = now.AddDays(forecastDays);

        var organization = await _dbContext.Organizations
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == organizationId, cancellationToken)
            ?? throw new InvalidOperationException("Organization was not found.");

        var subscription = await GetSubscriptionEntityAsync(organizationId, cancellationToken);

        var resources = await _dbContext.Resources
            .AsNoTracking()
            .Include(x => x.AvailabilityRules)
            .Where(x => x.OrganizationId == organizationId && x.IsActive)
            .ToListAsync(cancellationToken);

        var events = await _dbContext.EventSessions
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId)
            .ToListAsync(cancellationToken);

        var bookings = await _dbContext.Bookings
            .AsNoTracking()
            .Include(x => x.User)
            .Include(x => x.Resource)
            .Include(x => x.EventSession)
            .Where(x => x.OrganizationId == organizationId)
            .ToListAsync(cancellationToken);

        var views = (await _dbContext.AnalyticsEvents
                .AsNoTracking()
                .Where(x => x.OrganizationId == organizationId)
                .ToListAsync(cancellationToken))
            .Where(x => x.OccurredAtUtc >= normalizedFromUtc && x.OccurredAtUtc <= normalizedToUtc)
            .ToList();

        var activeBookings = bookings.Where(IsActiveBooking).ToList();
        var bookingsInPeriod = activeBookings
            .Where(x => x.StartAtUtc >= normalizedFromUtc && x.StartAtUtc <= normalizedToUtc)
            .ToList();

        var bookingsInPeriodIncludingCancelled = bookings
            .Where(x => x.StartAtUtc >= normalizedFromUtc && x.StartAtUtc <= normalizedToUtc)
            .ToList();

        var futureBookings = activeBookings
            .Where(x => x.StartAtUtc >= now && x.StartAtUtc <= forecastToUtc)
            .ToList();

        var resourceDictionary = resources.ToDictionary(x => x.Id);
        var eventDictionary = events.ToDictionary(x => x.Id);

        var organizationViews = views.Count(x => x.EntityType == AnalyticsEntityType.Organization);
        var resourceViews = views.Count(x => x.EntityType == AnalyticsEntityType.Resource);
        var eventViews = views.Count(x => x.EntityType == AnalyticsEntityType.EventSession);

        var newClients = activeBookings
            .Where(x => x.UserId != Guid.Empty)
            .GroupBy(x => x.UserId)
            .Count(group => group.Min(x => x.StartAtUtc) >= normalizedFromUtc && group.Min(x => x.StartAtUtc) <= normalizedToUtc);

        var repeatClients = bookingsInPeriod
            .GroupBy(x => x.UserId)
            .Count(group => group.Count() > 1);

        var atRiskClients = BuildAtRiskClients(activeBookings, now)
            .Take(10)
            .ToList();

        var staffResourceIds = resources
            .Where(x => x.Type == ResourceType.Trainer)
            .Select(x => x.Id)
            .ToHashSet();

        var serviceResourceIds = resources
            .Where(x => x.Type != ResourceType.Trainer)
            .Select(x => x.Id)
            .ToHashSet();

        var staffLeaderboard = bookingsInPeriod
            .Where(x => x.ResourceId.HasValue && staffResourceIds.Contains(x.ResourceId.Value))
            .GroupBy(x => x.ResourceId!.Value)
            .Select(group =>
            {
                var resource = resourceDictionary[group.Key];
                return new AnalyticsRankingItemResponse
                {
                    EntityType = AnalyticsEntityType.Resource,
                    EntityId = resource.Id,
                    Name = resource.Name,
                    Category = resource.Type.ToString(),
                    Views = views.Count(x => x.ResourceId == resource.Id),
                    Bookings = group.Count(),
                    UniqueClients = group.Select(x => x.UserId).Distinct().Count(),
                    ExpectedRevenue = group.Sum(x => x.Price ?? 0m)
                };
            })
            .OrderByDescending(x => x.Bookings)
            .ThenByDescending(x => x.ExpectedRevenue)
            .Take(5)
            .ToList();

        var topServices = bookingsInPeriod
            .Where(x => x.ResourceId.HasValue && serviceResourceIds.Contains(x.ResourceId.Value))
            .GroupBy(x => x.ResourceId!.Value)
            .Select(group =>
            {
                var resource = resourceDictionary[group.Key];
                return new AnalyticsRankingItemResponse
                {
                    EntityType = AnalyticsEntityType.Resource,
                    EntityId = resource.Id,
                    Name = resource.Name,
                    Category = resource.Type.ToString(),
                    Views = views.Count(x => x.ResourceId == resource.Id),
                    Bookings = group.Count(),
                    UniqueClients = group.Select(x => x.UserId).Distinct().Count(),
                    ExpectedRevenue = group.Sum(x => x.Price ?? 0m)
                };
            })
            .OrderByDescending(x => x.Bookings)
            .ThenByDescending(x => x.ExpectedRevenue)
            .Take(5)
            .ToList();

        var topViewedItems = views
            .GroupBy(x => new { x.EntityType, x.OrganizationId, x.ResourceId, x.EventSessionId })
            .Select(group =>
            {
                var sample = group.First();
                return new AnalyticsRankingItemResponse
                {
                    EntityType = sample.EntityType,
                    EntityId = sample.EntityType switch
                    {
                        AnalyticsEntityType.Organization => sample.OrganizationId ?? Guid.Empty,
                        AnalyticsEntityType.Resource => sample.ResourceId ?? Guid.Empty,
                        AnalyticsEntityType.EventSession => sample.EventSessionId ?? Guid.Empty,
                        _ => Guid.Empty
                    },
                    Name = sample.EntityType switch
                    {
                        AnalyticsEntityType.Organization => organization.Name,
                        AnalyticsEntityType.Resource when sample.ResourceId.HasValue && resourceDictionary.TryGetValue(sample.ResourceId.Value, out var resource) => resource.Name,
                        AnalyticsEntityType.EventSession when sample.EventSessionId.HasValue && eventDictionary.TryGetValue(sample.EventSessionId.Value, out var eventSession) => eventSession.Name,
                        _ => "Unknown"
                    },
                    Category = sample.EntityType switch
                    {
                        AnalyticsEntityType.Organization => organization.Type.ToString(),
                        AnalyticsEntityType.Resource when sample.ResourceId.HasValue && resourceDictionary.TryGetValue(sample.ResourceId.Value, out var resource) => resource.Type.ToString(),
                        AnalyticsEntityType.EventSession => "EventSession",
                        _ => null
                    },
                    Views = group.Count(),
                    Bookings = sample.EntityType switch
                    {
                        AnalyticsEntityType.Organization => bookingsInPeriod.Count,
                        AnalyticsEntityType.Resource when sample.ResourceId.HasValue => bookingsInPeriod.Count(x => x.ResourceId == sample.ResourceId),
                        AnalyticsEntityType.EventSession when sample.EventSessionId.HasValue => bookingsInPeriod.Count(x => x.EventSessionId == sample.EventSessionId),
                        _ => 0
                    },
                    UniqueClients = group.Where(x => x.UserId.HasValue).Select(x => x.UserId!.Value).Distinct().Count(),
                    ExpectedRevenue = sample.EntityType switch
                    {
                        AnalyticsEntityType.Organization => bookingsInPeriod.Sum(x => x.Price ?? 0m),
                        AnalyticsEntityType.Resource when sample.ResourceId.HasValue => bookingsInPeriod.Where(x => x.ResourceId == sample.ResourceId).Sum(x => x.Price ?? 0m),
                        AnalyticsEntityType.EventSession when sample.EventSessionId.HasValue => bookingsInPeriod.Where(x => x.EventSessionId == sample.EventSessionId).Sum(x => x.Price ?? 0m),
                        _ => 0m
                    }
                };
            })
            .Where(x => x.EntityId != Guid.Empty)
            .OrderByDescending(x => x.Views)
            .Take(6)
            .ToList();

        var occupancyRatePercent = CalculateOccupancyRate(resources, bookingsInPeriod, normalizedFromUtc, normalizedToUtc);
        var eventFillRatePercent = CalculateEventFillRate(events, bookingsInPeriod, normalizedFromUtc, normalizedToUtc);
        var expectedRevenue = futureBookings.Sum(x => x.Price ?? 0m);
        var totalViews = views.Count;
        var cancellations = bookingsInPeriodIncludingCancelled.Count(x => x.Status == BookingStatus.Cancelled);
        var cancellationRatePercent = bookingsInPeriodIncludingCancelled.Count == 0
            ? 0m
            : Math.Round(cancellations * 100m / bookingsInPeriodIncludingCancelled.Count, 2);
        var conversionRatePercent = totalViews == 0
            ? 0m
            : Math.Round(bookingsInPeriod.Count * 100m / totalViews, 2);
        var averageLeadTimeDays = bookingsInPeriod.Count == 0
            ? 0m
            : Math.Round((decimal)bookingsInPeriod.Average(x => Math.Max(0, (x.StartAtUtc - x.CreatedAtUtc).TotalDays)), 2);
        var currency = futureBookings.Select(x => x.Currency).FirstOrDefault(x => !string.IsNullOrWhiteSpace(x))
                       ?? bookingsInPeriod.Select(x => x.Currency).FirstOrDefault(x => !string.IsNullOrWhiteSpace(x))
                       ?? subscription?.Currency
                       ?? "USD";

        return new OrganizationAnalyticsResponse
        {
            HasAccess = true,
            FromUtc = normalizedFromUtc,
            ToUtc = normalizedToUtc,
            ForecastDays = forecastDays,
            Subscription = subscription is null ? null : ToSubscriptionResponse(subscription),
            TotalViews = totalViews,
            OrganizationViews = organizationViews,
            ResourceViews = resourceViews,
            EventViews = eventViews,
            BookingsInPeriod = bookingsInPeriod.Count,
            UpcomingBookings = futureBookings.Count,
            StaffBookings = bookingsInPeriod.Count(x => x.ResourceId.HasValue && staffResourceIds.Contains(x.ResourceId.Value)),
            NewClients = newClients,
            RepeatClients = repeatClients,
            AtRiskClients = atRiskClients.Count,
            ExpectedRevenue = expectedRevenue,
            Currency = currency,
            OccupancyRatePercent = occupancyRatePercent,
            EventFillRatePercent = eventFillRatePercent,
            ConversionRatePercent = conversionRatePercent,
            CancellationRatePercent = cancellationRatePercent,
            AverageLeadTimeDays = averageLeadTimeDays,
            StaffLeaderboard = staffLeaderboard,
            TopServices = topServices,
            TopViewedItems = topViewedItems,
            RetentionCandidates = atRiskClients
        };
    }

    public static bool IsSubscriptionActive(OrganizationSubscription? subscription, DateTimeOffset nowUtc)
    {
        if (subscription is null || !subscription.IsAnalyticsEnabled)
        {
            return false;
        }

        var startsAtUtc = subscription.StartsAtUtc.ToUniversalTime();
        var endsAtUtc = subscription.EndsAtUtc?.ToUniversalTime();
        return startsAtUtc <= nowUtc && (!endsAtUtc.HasValue || endsAtUtc.Value >= nowUtc);
    }

    public static OrganizationSubscriptionResponse ToSubscriptionResponse(OrganizationSubscription subscription)
    {
        var nowUtc = BookingFlowClock.UtcNow;
        return new OrganizationSubscriptionResponse
        {
            OrganizationId = subscription.OrganizationId,
            Plan = subscription.Plan,
            IsAnalyticsEnabled = subscription.IsAnalyticsEnabled,
            IsActive = IsSubscriptionActive(subscription, nowUtc),
            StartsAtUtc = subscription.StartsAtUtc,
            EndsAtUtc = subscription.EndsAtUtc,
            MonthlyPrice = subscription.MonthlyPrice,
            Currency = subscription.Currency
        };
    }

    public static ProviderOrganizationAffiliationResponse ToAffiliationResponse(ProviderOrganizationAffiliation affiliation)
    {
        return new ProviderOrganizationAffiliationResponse
        {
            OrganizationId = affiliation.OrganizationId,
            OrganizationName = affiliation.Organization.Name,
            Title = affiliation.Title,
            IsPrimary = affiliation.IsPrimary,
            IsActive = affiliation.IsActive
        };
    }

    private static bool IsActiveBooking(Booking booking)
    {
        return booking.Status is not (BookingStatus.Cancelled or BookingStatus.Expired);
    }

    private static List<AnalyticsAtRiskClientResponse> BuildAtRiskClients(
        IEnumerable<Booking> activeBookings,
        DateTimeOffset nowUtc)
    {
        var thresholdUtc = nowUtc.AddDays(-ReturnWindowDays);

        return activeBookings
            .GroupBy(x => x.UserId)
            .Select(group =>
            {
                var orderedBookings = group
                    .OrderByDescending(x => x.StartAtUtc)
                    .ToList();

                var lastPastBooking = orderedBookings.FirstOrDefault(x => x.StartAtUtc <= nowUtc);
                var hasFutureBooking = orderedBookings.Any(x => x.StartAtUtc > nowUtc);

                if (lastPastBooking is null || hasFutureBooking || lastPastBooking.StartAtUtc >= thresholdUtc)
                {
                    return null;
                }

                var user = lastPastBooking.User;
                return new AnalyticsAtRiskClientResponse
                {
                    UserId = group.Key,
                    FullName = $"{user.FirstName} {user.LastName}".Trim(),
                    Email = user.Email,
                    Phone = user.Phone,
                    LastBookingAtUtc = lastPastBooking.StartAtUtc,
                    LastBookingName = lastPastBooking.Resource?.Name ?? lastPastBooking.EventSession?.Name ?? "Booking",
                    LifetimeBookings = orderedBookings.Count,
                    LifetimeValue = orderedBookings.Sum(x => x.Price ?? 0m)
                };
            })
            .Where(x => x is not null)
            .OrderBy(x => x!.LastBookingAtUtc)
            .Select(x => x!)
            .ToList();
    }

    private static decimal CalculateOccupancyRate(
        IReadOnlyCollection<Resource> resources,
        IReadOnlyCollection<Booking> bookingsInPeriod,
        DateTimeOffset fromUtc,
        DateTimeOffset toUtc)
    {
        var totalAvailableMinutes = resources.Sum(resource => CalculateAvailableMinutes(resource.AvailabilityRules, fromUtc, toUtc));
        if (totalAvailableMinutes <= 0)
        {
            return 0m;
        }

        var resourceIds = resources.Select(x => x.Id).ToHashSet();
        var bookedMinutes = bookingsInPeriod
            .Where(x => x.ResourceId.HasValue && resourceIds.Contains(x.ResourceId.Value))
            .Sum(x => CalculateOverlapMinutes(x.StartAtUtc, x.EndAtUtc, fromUtc, toUtc));

        return Math.Round(bookedMinutes * 100m / totalAvailableMinutes, 2);
    }

    private static decimal CalculateEventFillRate(
        IReadOnlyCollection<EventSession> events,
        IReadOnlyCollection<Booking> bookingsInPeriod,
        DateTimeOffset fromUtc,
        DateTimeOffset toUtc)
    {
        var eventsInPeriod = events
            .Where(x => x.StartAtUtc >= fromUtc && x.StartAtUtc <= toUtc && x.IsActive)
            .ToList();

        if (eventsInPeriod.Count == 0)
        {
            return 0m;
        }

        var eventIds = eventsInPeriod.Select(x => x.Id).ToHashSet();
        var reservedGuests = bookingsInPeriod
            .Where(x => x.EventSessionId.HasValue && eventIds.Contains(x.EventSessionId.Value))
            .Sum(x => x.GuestCount);

        var totalCapacity = eventsInPeriod.Sum(x => x.Capacity);
        return totalCapacity == 0 ? 0m : Math.Round(reservedGuests * 100m / totalCapacity, 2);
    }

    private static decimal CalculateAvailableMinutes(
        IEnumerable<AvailabilityRule> rules,
        DateTimeOffset fromUtc,
        DateTimeOffset toUtc)
    {
        var totalMinutes = 0m;
        var currentDate = fromUtc.Date;
        var endDate = toUtc.Date;

        while (currentDate <= endDate)
        {
            foreach (var rule in rules.Where(x => x.IsActive && x.DayOfWeek == currentDate.DayOfWeek))
            {
                totalMinutes += (decimal)(rule.EndTime - rule.StartTime).TotalMinutes;
            }

            currentDate = currentDate.AddDays(1);
        }

        return totalMinutes;
    }

    private static decimal CalculateOverlapMinutes(
        DateTimeOffset startAtUtc,
        DateTimeOffset endAtUtc,
        DateTimeOffset fromUtc,
        DateTimeOffset toUtc)
    {
        var overlapStart = startAtUtc > fromUtc ? startAtUtc : fromUtc;
        var overlapEnd = endAtUtc < toUtc ? endAtUtc : toUtc;

        if (overlapEnd <= overlapStart)
        {
            return 0m;
        }

        return (decimal)(overlapEnd - overlapStart).TotalMinutes;
    }
}
