using BookingFlow.Api.Models.Content;
using BookingFlow.Domain.Enum;

namespace BookingFlow.Api.Contract.ResourceRequest;

public sealed class ResourceResponse
{
    public Guid Id { get; set; }
    public Guid? OrganizationId { get; set; }
    public string? OrganizationName { get; set; }
    public Guid? ProviderProfileId { get; set; }
    public string? ProviderDisplayName { get; set; }
    public string? ProviderAvatarImageUrl { get; set; }
    public string Name { get; set; } = null!;
    public ResourceType Type { get; set; }
    public string? Description { get; set; }
    public string? Location { get; set; }
    public int Capacity { get; set; }
    public int SlotSizeMinutes { get; set; }
    public int? ExperienceYears { get; set; }
    public decimal? PriceFrom { get; set; }
    public string? AvatarImageUrl { get; set; }
    public string? CoverImageUrl { get; set; }
    public IReadOnlyCollection<MediaAssetItem> Gallery { get; set; } = Array.Empty<MediaAssetItem>();
    public IReadOnlyCollection<MediaAssetItem> Documents { get; set; } = Array.Empty<MediaAssetItem>();
    public ResourceContent Content { get; set; } = new();
    public bool IsActive { get; set; }
    public ModerationStatus ApprovalStatus { get; set; }
    public string? ModerationNote { get; set; }
    public int AvailabilityRulesCount { get; set; }
}
