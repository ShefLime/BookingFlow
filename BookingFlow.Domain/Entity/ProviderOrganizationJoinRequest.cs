using BookingFlow.Domain.Enum;

namespace BookingFlow.Domain.Entity;

public sealed class ProviderOrganizationJoinRequest : BaseEntity
{
    public Guid ProviderProfileId { get; set; }
    public ProviderProfile ProviderProfile { get; set; } = null!;

    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;

    public string? Message { get; set; }
    public ProviderOrganizationJoinRequestStatus Status { get; set; } = ProviderOrganizationJoinRequestStatus.Pending;
    public string? ReviewNote { get; set; }
    public Guid? ReviewedByUserId { get; set; }
    public User? ReviewedByUser { get; set; }
    public DateTimeOffset? ReviewedAtUtc { get; set; }
}
