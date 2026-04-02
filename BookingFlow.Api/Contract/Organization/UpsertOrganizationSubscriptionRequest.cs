using BookingFlow.Domain.Enum;

namespace BookingFlow.Api.Contract.Organization;

public sealed class UpsertOrganizationSubscriptionRequest
{
    public OrganizationSubscriptionPlan Plan { get; set; } = OrganizationSubscriptionPlan.Starter;
    public bool IsAnalyticsEnabled { get; set; } = true;
    public DateTimeOffset StartsAtUtc { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? EndsAtUtc { get; set; }
    public decimal? MonthlyPrice { get; set; }
    public string? Currency { get; set; }
}
