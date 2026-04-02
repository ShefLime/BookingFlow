namespace BookingFlow.Domain.Entity;

public sealed class User : BaseEntity
{
    public string KeycloakSubject { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string? Phone { get; set; }
    public string? AvatarImageUrl { get; set; }
    public string? PreferredLocale { get; set; }
    public string? RolesJson { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<OrganizationMembership> OrganizationMemberships { get; set; } = new List<OrganizationMembership>();
    public ProviderProfile? ProviderProfile { get; set; }
}
