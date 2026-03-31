namespace BookingFlow.App.Feature;

public sealed record CreateOrganizationCommand(
    string Name,
    string Description,
    string TimeZone,
    string Address,
    int Type);

public sealed record UpdateOrganizationCommand(
    Guid OrganizationId,
    string Name,
    string Description,
    string TimeZone,
    string Address,
    int Type,
    bool IsActive);
    
    
public sealed record GetOrganizationByIdQuery(Guid OrganizationId);

public sealed record GetOrganizationsQuery(
    int Page = 1,
    int PageSize = 20);