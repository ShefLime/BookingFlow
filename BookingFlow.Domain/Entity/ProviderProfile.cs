using BookingFlow.Domain.Enum;

namespace BookingFlow.Domain.Entity;

public sealed class ProviderProfile : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string DisplayName { get; set; } = null!;
    public string Headline { get; set; } = null!;
    public string? City { get; set; }
    public string TimeZone { get; set; } = "UTC";
    public string? Location { get; set; }
    public string? AvatarImageUrl { get; set; }
    public string? CoverImageUrl { get; set; }
    public string? GalleryJson { get; set; }
    public string? DocumentsJson { get; set; }
    public string? ContentJson { get; set; }
    public ModerationStatus ApprovalStatus { get; set; } = ModerationStatus.PendingApproval;
    public string? ModerationNote { get; set; }
    public DateTimeOffset? ReviewedAtUtc { get; set; }
    public Guid? ReviewedByUserId { get; set; }

    public ICollection<Resource> Resources { get; set; } = new List<Resource>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<ProviderOrganizationAffiliation> Affiliations { get; set; } = new List<ProviderOrganizationAffiliation>();
    public ICollection<ProviderOrganizationJoinRequest> OrganizationJoinRequests { get; set; } = new List<ProviderOrganizationJoinRequest>();
}
