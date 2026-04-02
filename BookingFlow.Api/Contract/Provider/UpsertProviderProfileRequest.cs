using BookingFlow.Api.Models.Content;

namespace BookingFlow.Api.Contract.Provider;

public sealed class UpsertProviderProfileRequest
{
    public string DisplayName { get; set; } = null!;
    public string Headline { get; set; } = null!;
    public string? City { get; set; }
    public string TimeZone { get; set; } = "UTC";
    public string? Location { get; set; }
    public string? AvatarImageUrl { get; set; }
    public string? CoverImageUrl { get; set; }
    public IReadOnlyCollection<MediaAssetItem> Gallery { get; set; } = Array.Empty<MediaAssetItem>();
    public IReadOnlyCollection<MediaAssetItem> Documents { get; set; } = Array.Empty<MediaAssetItem>();
    public ProviderContent Content { get; set; } = new();
}
