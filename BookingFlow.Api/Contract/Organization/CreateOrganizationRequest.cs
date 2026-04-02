using BookingFlow.Domain.Enum;
using BookingFlow.Api.Models.Content;

namespace BookingFlow.Api.Contract.Organization;

public sealed class CreateOrganizationRequest
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
    public IReadOnlyCollection<MediaAssetItem> Gallery { get; set; } = Array.Empty<MediaAssetItem>();
    public IReadOnlyCollection<MediaAssetItem> Documents { get; set; } = Array.Empty<MediaAssetItem>();
    public OrganizationContent Content { get; set; } = new();
}
