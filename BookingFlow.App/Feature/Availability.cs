namespace BookingFlow.App.Feature;

public sealed record SetAvailabilityRuleCommand(
    Guid ResourceId,
    DayOfWeek DayOfWeek,
    TimeSpan StartTime,
    TimeSpan EndTime);

public sealed record GetAvailabilityQuery(
    Guid ResourceId,
    DateOnly Date);