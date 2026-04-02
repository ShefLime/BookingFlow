using BookingFlow.Api.Models.Content;

namespace BookingFlow.Api.Contract.Event;

public sealed class CreateEventRequest
{
    public Guid OrganizationId { get; set; }
    public string Name { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string Location { get; set; } = null!;
    public DateTimeOffset StartAtUtc { get; set; }
    public DateTimeOffset EndAtUtc { get; set; }
    public int Capacity { get; set; } = 1;
    public string? PosterImageUrl { get; set; }
    public IReadOnlyCollection<MediaAssetItem> Gallery { get; set; } = Array.Empty<MediaAssetItem>();
    public IReadOnlyCollection<MediaAssetItem> Documents { get; set; } = Array.Empty<MediaAssetItem>();
    public EventContent Content { get; set; } = new();
}
