namespace BookingFlow.Api.Contract.Booking;

public sealed class RescheduleBookingRequest
{
    public DateTimeOffset NewStartAtUtc { get; set; }
    public DateTimeOffset NewEndAtUtc { get; set; }
}