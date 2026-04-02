using BookingFlow.Domain.Enum;
using BookingFlow.Api.Models.Content;

namespace BookingFlow.Api.Contract.ResourceRequest;

public sealed class UpdateResourceRequest
{
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
    public IReadOnlyCollection<MediaAssetItem> Gallery { get; set; } = Array.Empty<MediaAssetItem>();
    public IReadOnlyCollection<MediaAssetItem> Documents { get; set; } = Array.Empty<MediaAssetItem>();
    public ResourceContent Content { get; set; } = new();
    public bool IsActive { get; set; }
}
