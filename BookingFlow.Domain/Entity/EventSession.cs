namespace BookingFlow.Domain.Entity;

public sealed class EventSession : BaseEntity
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;

    public string Name { get; set; } = null!;
    public string Description { get; set; } = null!;
    public string Location { get; set; } = null!;
    public string? PosterImageUrl { get; set; }
    public string? GalleryJson { get; set; }
    public string? DocumentsJson { get; set; }
    public string? ContentJson { get; set; }

    public DateTimeOffset StartAtUtc { get; set; }
    public DateTimeOffset EndAtUtc { get; set; }
    public int Capacity { get; set; } = 1;
    public bool IsActive { get; set; } = true;

    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
