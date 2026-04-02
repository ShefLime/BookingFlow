using BookingFlow.Domain.Enum;

namespace BookingFlow.Domain.Entity;

public sealed class Resource : BaseEntity
{
    public Guid? OrganizationId { get; set; }
    public Organization? Organization { get; set; }
    public Guid? ProviderProfileId { get; set; }
    public ProviderProfile? ProviderProfile { get; set; }

    public string Name { get; set; } = null!;
    public ResourceType Type { get; set; }

    public string? Description { get; set; }
    public string? Location { get; set; }
    public int Capacity { get; set; } = 1;
    public int SlotSizeMinutes { get; set; } = 60;
    public int? ExperienceYears { get; set; }
    public decimal? PriceFrom { get; set; }
    public string? AvatarImageUrl { get; set; }
    public string? CoverImageUrl { get; set; }
    public string? GalleryJson { get; set; }
    public string? DocumentsJson { get; set; }
    public string? ContentJson { get; set; }
    public bool IsActive { get; set; } = true;
    public ModerationStatus ApprovalStatus { get; set; } = ModerationStatus.Approved;
    public string? ModerationNote { get; set; }

    public ICollection<AvailabilityRule> AvailabilityRules { get; set; } = new List<AvailabilityRule>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
