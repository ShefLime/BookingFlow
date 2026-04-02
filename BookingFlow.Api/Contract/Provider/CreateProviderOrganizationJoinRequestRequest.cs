namespace BookingFlow.Api.Contract.Provider;

public sealed class CreateProviderOrganizationJoinRequestRequest
{
    public Guid OrganizationId { get; set; }
    public string? Message { get; set; }
}
