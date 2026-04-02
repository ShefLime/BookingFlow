namespace BookingFlow.Api.Models.Content;

public sealed class OrganizationContent
{
    public LocalizedTextSet HeroTitle { get; set; } = new();
    public LocalizedTextSet HeroSubtitle { get; set; } = new();
    public LocalizedTextSet Summary { get; set; } = new();
    public LocalizedTextSet Description { get; set; } = new();
    public LocalizedTextSet Atmosphere { get; set; } = new();
    public LocalizedStringCollectionSet Amenities { get; set; } = new();
    public LocalizedStringCollectionSet ServiceHighlights { get; set; } = new();
}
