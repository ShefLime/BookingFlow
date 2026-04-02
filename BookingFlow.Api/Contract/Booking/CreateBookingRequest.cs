namespace BookingFlow.Api.Contract.Booking;

public sealed class CreateBookingRequest
{
    public Guid? OrganizationId { get; set; }
    public Guid ResourceId { get; set; }
    public DateTimeOffset StartAtUtc { get; set; }
    public DateTimeOffset EndAtUtc { get; set; }
    public int GuestCount { get; set; } = 1;
    public string? Comment { get; set; }
}
