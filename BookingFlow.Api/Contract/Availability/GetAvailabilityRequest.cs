namespace BookingFlow.Api.Contract.Availability;

public sealed class GetAvailabilityRequest
{
    public Guid ResourceId { get; set; }
    public DateOnly Date { get; set; }
}