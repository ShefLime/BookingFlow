namespace BookingFlow.Domain.Entity;

public sealed class ProviderOrganizationAffiliation : BaseEntity
{
    public Guid ProviderProfileId { get; set; }
    public ProviderProfile ProviderProfile { get; set; } = null!;

    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;

    public string Title { get; set; } = "Resident Provider";
    public bool IsPrimary { get; set; }
    public bool IsActive { get; set; } = true;
}
