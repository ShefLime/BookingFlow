using BookingFlow.Domain.Enum;

namespace BookingFlow.Domain.Entity;

public sealed class Booking : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public Guid? OrganizationId { get; set; }
    public Organization? Organization { get; set; }
    public Guid? ProviderProfileId { get; set; }
    public ProviderProfile? ProviderProfile { get; set; }

    public Guid? ResourceId { get; set; }
    public Resource? Resource { get; set; }

    public Guid? EventSessionId { get; set; }
    public EventSession? EventSession { get; set; }

    public DateTimeOffset StartAtUtc { get; set; }
    public DateTimeOffset EndAtUtc { get; set; }
    public int GuestCount { get; set; } = 1;

    public BookingStatus Status { get; set; } = BookingStatus.Confirmed;

    public string? Comment { get; set; }
    public string? CancellationReason { get; set; }
    public decimal? Price { get; set; }
    public string? Currency { get; set; }

    public DateTimeOffset? ConfirmedAtUtc { get; set; }
    public DateTimeOffset? CancelledAtUtc { get; set; }
}
