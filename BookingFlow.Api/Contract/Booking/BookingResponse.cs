using BookingFlow.Domain.Enum;

namespace BookingFlow.Api.Contract.Booking;

public sealed class BookingResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid OrganizationId { get; set; }
    public string OrganizationName { get; set; } = null!;
    public Guid? ResourceId { get; set; }
    public string? ResourceName { get; set; }
    public Guid? EventSessionId { get; set; }
    public string? EventName { get; set; }
    public DateTimeOffset StartAtUtc { get; set; }
    public DateTimeOffset EndAtUtc { get; set; }
    public int GuestCount { get; set; }
    public BookingStatus Status { get; set; }
    public string? Comment { get; set; }
    public string? CancellationReason { get; set; }
    public decimal? Price { get; set; }
    public string? Currency { get; set; }
    public DateTimeOffset? ConfirmedAtUtc { get; set; }
    public DateTimeOffset? CancelledAtUtc { get; set; }
}
