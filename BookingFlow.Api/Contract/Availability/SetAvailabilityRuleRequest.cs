namespace BookingFlow.Api.Contract.Availability;

public sealed class SetAvailabilityRuleRequest
{
    public Guid ResourceId { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
}