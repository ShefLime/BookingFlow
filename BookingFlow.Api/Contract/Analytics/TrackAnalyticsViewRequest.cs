using BookingFlow.Domain.Enum;

namespace BookingFlow.Api.Contract.Analytics;

public sealed class TrackAnalyticsViewRequest
{
    public AnalyticsEntityType EntityType { get; set; }
    public Guid EntityId { get; set; }
    public string VisitorId { get; set; } = null!;
    public string? Path { get; set; }
    public string? Referrer { get; set; }
}
