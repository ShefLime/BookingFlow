using BookingFlow.Domain.Enum;

namespace BookingFlow.Domain.Entity;

public sealed class Organization : BaseEntity
{
    public string Name { get; set; } = null!;
    public OrganizationType Type { get; set; }
    public string Description { get; set; } = null!;
    public string TimeZone { get; set; } = "UTC";
    public string Address { get; set; } = null!;
    public bool IsActive { get; set; } = true;

    public ICollection<Resource> Resources { get; set; } = new List<Resource>();
    public ICollection<EventSession> Events { get; set; } = new List<EventSession>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
