using BookingFlow.Domain.Enum;

namespace BookingFlow.Api.Contract.Organization;

public sealed class UpdateOrganizationRequest
{
    public string Name { get; set; } = null!;
    public OrganizationType Type { get; set; }
    public string Description { get; set; } = null!;
    public string TimeZone { get; set; } = "UTC";
    public string Address { get; set; } = null!;
    public bool IsActive { get; set; }
}