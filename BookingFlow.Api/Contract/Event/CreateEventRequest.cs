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
}
