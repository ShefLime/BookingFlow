using BookingFlow.Api.Contract.Organization;
using BookingFlow.Domain.Enum;

namespace BookingFlow.Api.Contract.Analytics;

public sealed class OrganizationAnalyticsResponse
{
    public bool HasAccess { get; set; }
    public string? AccessMessage { get; set; }
    public DateTimeOffset FromUtc { get; set; }
    public DateTimeOffset ToUtc { get; set; }
    public int ForecastDays { get; set; }
    public OrganizationSubscriptionResponse? Subscription { get; set; }
    public int TotalViews { get; set; }
    public int OrganizationViews { get; set; }
    public int ResourceViews { get; set; }
    public int EventViews { get; set; }
    public int BookingsInPeriod { get; set; }
    public int UpcomingBookings { get; set; }
    public int StaffBookings { get; set; }
    public int NewClients { get; set; }
    public int RepeatClients { get; set; }
    public int AtRiskClients { get; set; }
    public decimal ExpectedRevenue { get; set; }
    public string Currency { get; set; } = "USD";
    public decimal OccupancyRatePercent { get; set; }
    public decimal EventFillRatePercent { get; set; }
    public decimal ConversionRatePercent { get; set; }
    public decimal CancellationRatePercent { get; set; }
    public decimal AverageLeadTimeDays { get; set; }
    public IReadOnlyCollection<AnalyticsRankingItemResponse> StaffLeaderboard { get; set; } =
        Array.Empty<AnalyticsRankingItemResponse>();
    public IReadOnlyCollection<AnalyticsRankingItemResponse> TopServices { get; set; } =
        Array.Empty<AnalyticsRankingItemResponse>();
    public IReadOnlyCollection<AnalyticsRankingItemResponse> TopViewedItems { get; set; } =
        Array.Empty<AnalyticsRankingItemResponse>();
    public IReadOnlyCollection<AnalyticsAtRiskClientResponse> RetentionCandidates { get; set; } =
        Array.Empty<AnalyticsAtRiskClientResponse>();
}

public sealed class AnalyticsRankingItemResponse
{
    public AnalyticsEntityType EntityType { get; set; }
    public Guid EntityId { get; set; }
    public string Name { get; set; } = null!;
    public string? Category { get; set; }
    public int Views { get; set; }
    public int Bookings { get; set; }
    public int UniqueClients { get; set; }
    public decimal ExpectedRevenue { get; set; }
}

public sealed class AnalyticsAtRiskClientResponse
{
    public Guid UserId { get; set; }
    public string FullName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Phone { get; set; }
    public DateTimeOffset LastBookingAtUtc { get; set; }
    public string LastBookingName { get; set; } = null!;
    public int LifetimeBookings { get; set; }
    public decimal LifetimeValue { get; set; }
}
