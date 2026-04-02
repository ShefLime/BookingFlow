using BookingFlow.Domain.Enum;

namespace BookingFlow.Domain.Entity;

public sealed class Organization : BaseEntity
{
    public string Name { get; set; } = null!;
    public OrganizationType Type { get; set; }
    public string Description { get; set; } = null!;
    public string TimeZone { get; set; } = "UTC";
    public string Address { get; set; } = null!;
    public string? City { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? WebsiteUrl { get; set; }
    public string? LogoImageUrl { get; set; }
    public string? CoverImageUrl { get; set; }
    public string? GalleryJson { get; set; }
    public string? DocumentsJson { get; set; }
    public string? ContentJson { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Resource> Resources { get; set; } = new List<Resource>();
    public ICollection<EventSession> Events { get; set; } = new List<EventSession>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<OrganizationMembership> Memberships { get; set; } = new List<OrganizationMembership>();
    public ICollection<OrganizationSubscription> Subscriptions { get; set; } = new List<OrganizationSubscription>();
    public ICollection<ProviderOrganizationAffiliation> ProviderAffiliations { get; set; } = new List<ProviderOrganizationAffiliation>();
    public ICollection<ProviderOrganizationJoinRequest> ProviderJoinRequests { get; set; } = new List<ProviderOrganizationJoinRequest>();
}
