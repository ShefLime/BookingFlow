using BookingFlow.Domain.Enum;

namespace BookingFlow.Domain.Entity;

public sealed class Resource : BaseEntity
{
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;

    public string Name { get; set; } = null!;
    public ResourceType Type { get; set; }

    public string? Description { get; set; }
    public int Capacity { get; set; } = 1;
    public int SlotSizeMinutes { get; set; } = 60;
    public bool IsActive { get; set; } = true;

    public ICollection<AvailabilityRule> AvailabilityRules { get; set; } = new List<AvailabilityRule>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
