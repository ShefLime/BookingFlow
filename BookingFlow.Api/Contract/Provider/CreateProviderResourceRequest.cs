using BookingFlow.Api.Models.Content;
using BookingFlow.Domain.Enum;

namespace BookingFlow.Api.Contract.Provider;

public sealed class CreateProviderResourceRequest
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
}
