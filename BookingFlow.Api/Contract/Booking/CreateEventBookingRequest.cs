namespace BookingFlow.Api.Contract.Booking;

public sealed class CreateEventBookingRequest
{
    public Guid OrganizationId { get; set; }
    public Guid EventSessionId { get; set; }
    public int GuestCount { get; set; } = 1;
    public string? Comment { get; set; }
}
