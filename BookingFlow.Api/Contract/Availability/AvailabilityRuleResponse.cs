namespace BookingFlow.Api.Contract.Availability;

public sealed class AvailabilityRuleResponse
{
    public Guid Id { get; set; }
    public Guid ResourceId { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public bool IsActive { get; set; }
}
