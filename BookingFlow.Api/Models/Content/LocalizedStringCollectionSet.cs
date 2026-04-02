namespace BookingFlow.Api.Models.Content;

public sealed class LocalizedStringCollectionSet
{
    public IReadOnlyCollection<string> Ru { get; set; } = Array.Empty<string>();
    public IReadOnlyCollection<string> En { get; set; } = Array.Empty<string>();
    public IReadOnlyCollection<string> Vi { get; set; } = Array.Empty<string>();
}
