using BookingFlow.Domain.Enum;

namespace BookingFlow.Api.Contract.ResourceRequest;

public sealed class ResourceResponse
{
    public Guid Id { get; set; }
    public Guid OrganizationId { get; set; }
    public string OrganizationName { get; set; } = null!;
    public string Name { get; set; } = null!;
    public ResourceType Type { get; set; }
    public string? Description { get; set; }
    public int Capacity { get; set; }
    public int SlotSizeMinutes { get; set; }
    public bool IsActive { get; set; }
    public int AvailabilityRulesCount { get; set; }
}
