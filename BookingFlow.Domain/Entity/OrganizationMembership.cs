namespace BookingFlow.Domain.Entity;

public sealed class OrganizationMembership : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;

    public string Title { get; set; } = "Manager";
    public bool IsActive { get; set; } = true;
}
