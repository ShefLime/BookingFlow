namespace BookingFlow.Api.Models.Content;

public sealed class ProviderContent
{
    public LocalizedTextSet Summary { get; set; } = new();
    public LocalizedTextSet Biography { get; set; } = new();
    public LocalizedTextSet Approach { get; set; } = new();
    public LocalizedTextSet Quote { get; set; } = new();
    public LocalizedStringCollectionSet Specialties { get; set; } = new();
    public LocalizedStringCollectionSet Highlights { get; set; } = new();
}
