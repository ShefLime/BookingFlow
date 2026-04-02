namespace BookingFlow.Api.Models.Content;

public sealed class MediaAssetItem
{
    public string Url { get; set; } = null!;
    public string Kind { get; set; } = "image";
    public string? Title { get; set; }
}
