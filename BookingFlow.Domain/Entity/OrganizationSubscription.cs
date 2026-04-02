using BookingFlow.Domain.Enum;

namespace BookingFlow.Domain.Entity;

public sealed class OrganizationSubscription : BaseEntity
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;

    public OrganizationSubscriptionPlan Plan { get; set; } = OrganizationSubscriptionPlan.Starter;
    public bool IsAnalyticsEnabled { get; set; } = true;
    public DateTimeOffset StartsAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? EndsAtUtc { get; set; }
    public decimal? MonthlyPrice { get; set; }
    public string? Currency { get; set; }
}
