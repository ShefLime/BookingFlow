namespace BookingFlow.Api.Contract.Availability;

public sealed class AvailableSlotResponse
{
    public DateTimeOffset StartAtUtc { get; set; }
    public DateTimeOffset EndAtUtc { get; set; }
    public bool IsAvailable { get; set; }
    public string OrganizationTimeZone { get; set; } = null!;
}
