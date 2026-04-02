using BookingFlow.Domain.Enum;

namespace BookingFlow.Domain.Entity;

public sealed class AnalyticsEvent : BaseEntity
{
    public AnalyticsEventType EventType { get; set; } = AnalyticsEventType.PageView;
    public AnalyticsEntityType EntityType { get; set; }

    public Guid? UserId { get; set; }
    public User? User { get; set; }

    public Guid? OrganizationId { get; set; }
    public Organization? Organization { get; set; }

    public Guid? ResourceId { get; set; }
    public Resource? Resource { get; set; }

    public Guid? EventSessionId { get; set; }
    public EventSession? EventSession { get; set; }

    public string VisitorId { get; set; } = null!;
    public string? Path { get; set; }
    public string? Referrer { get; set; }
    public string? UserAgent { get; set; }
    public DateTimeOffset OccurredAtUtc { get; set; } = DateTimeOffset.UtcNow;
}
