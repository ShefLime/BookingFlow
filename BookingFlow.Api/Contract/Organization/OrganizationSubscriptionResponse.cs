using BookingFlow.Domain.Enum;

namespace BookingFlow.Api.Contract.Organization;

public sealed class OrganizationSubscriptionResponse
{
    public Guid OrganizationId { get; set; }
    public OrganizationSubscriptionPlan Plan { get; set; }
    public bool IsAnalyticsEnabled { get; set; }
    public bool IsActive { get; set; }
    public DateTimeOffset StartsAtUtc { get; set; }
    public DateTimeOffset? EndsAtUtc { get; set; }
    public decimal? MonthlyPrice { get; set; }
    public string? Currency { get; set; }
}
