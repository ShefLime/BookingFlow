namespace BookingFlow.App.Feature;

public sealed record CreateResourceCommand(
    Guid OrganizationId,
    string Name,
    int Type,
    string? Description,
    int Capacity,
    int SlotSizeMinutes);

public sealed record UpdateResourceCommand(
    Guid ResourceId,
    string Name,
    int Type,
    string? Description,
    int Capacity,
    int SlotSizeMinutes,
    bool IsActive);

public sealed record GetResourceByIdQuery(Guid ResourceId);

public sealed record GetResourcesQuery(
    Guid OrganizationId,
    int Page = 1,
    int PageSize = 20);
