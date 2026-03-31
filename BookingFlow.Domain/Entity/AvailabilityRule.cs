namespace BookingFlow.Domain.Entity;

public sealed class AvailabilityRule : BaseEntity
{
    public Guid ResourceId { get; set; }
    public Resource Resource { get; set; } = null!;

    public DayOfWeek DayOfWeek { get; set; }

    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }

    public bool IsActive { get; set; } = true;
}