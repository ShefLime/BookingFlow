namespace BookingFlow.Api.Models.Content;

public sealed class EventContent
{
    public LocalizedTextSet Summary { get; set; } = new();
    public LocalizedTextSet Description { get; set; } = new();
    public LocalizedTextSet Notes { get; set; } = new();
    public LocalizedStringCollectionSet Agenda { get; set; } = new();
    public LocalizedStringCollectionSet IncludedItems { get; set; } = new();
}
