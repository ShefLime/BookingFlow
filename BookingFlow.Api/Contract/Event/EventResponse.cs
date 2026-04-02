using BookingFlow.Api.Models.Content;

namespace BookingFlow.Api.Contract.Event;

public sealed class EventResponse
{
    public Guid Id { get; set; }
    public Guid OrganizationId { get; set; }
    public string OrganizationName { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string Location { get; set; } = null!;
    public string? PosterImageUrl { get; set; }
    public IReadOnlyCollection<MediaAssetItem> Gallery { get; set; } = Array.Empty<MediaAssetItem>();
    public IReadOnlyCollection<MediaAssetItem> Documents { get; set; } = Array.Empty<MediaAssetItem>();
    public EventContent Content { get; set; } = new();
    public DateTimeOffset StartAtUtc { get; set; }
    public DateTimeOffset EndAtUtc { get; set; }
    public int Capacity { get; set; }
    public int RemainingCapacity { get; set; }
    public bool IsActive { get; set; }
}
