namespace BookingFlow.Api.Contract.Admin;

public sealed class AssignManagerMembershipRequest
{
    public Guid UserId { get; set; }
    public Guid OrganizationId { get; set; }
    public string Title { get; set; } = "Manager";
}
