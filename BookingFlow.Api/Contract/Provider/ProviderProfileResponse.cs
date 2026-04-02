using BookingFlow.Api.Models.Content;
using BookingFlow.Domain.Enum;

namespace BookingFlow.Api.Contract.Provider;

public sealed class ProviderProfileResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
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
    public ModerationStatus ApprovalStatus { get; set; }
    public string? ModerationNote { get; set; }
    public int ServicesCount { get; set; }
    public IReadOnlyCollection<ProviderOrganizationAffiliationResponse> Affiliations { get; set; } =
        Array.Empty<ProviderOrganizationAffiliationResponse>();
}
