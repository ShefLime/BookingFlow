using BookingFlow.Domain.Enum;

namespace BookingFlow.Api.Contract.ResourceRequest;

public sealed class CreateResourceRequest
{
    public Guid OrganizationId { get; set; }
    public string Name { get; set; } = null!;
    public ResourceType Type { get; set; }
    public string? Description { get; set; }
    public int Capacity { get; set; } = 1;
    public int SlotSizeMinutes { get; set; } = 60;
}