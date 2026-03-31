using BookingFlow.Domain.Enum;

namespace BookingFlow.Api.Contract.Organization;

public sealed class OrganizationResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public OrganizationType Type { get; set; }
    public string Description { get; set; } = null!;
    public string TimeZone { get; set; } = null!;
    public string Address { get; set; } = null!;
    public bool IsActive { get; set; }
    public int ResourcesCount { get; set; }
    public int EventsCount { get; set; }
}
