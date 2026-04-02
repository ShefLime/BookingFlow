namespace BookingFlow.Api.Contract.Provider;

public sealed class ProviderOrganizationAffiliationResponse
{
    public Guid OrganizationId { get; set; }
    public string OrganizationName { get; set; } = null!;
    public string Title { get; set; } = null!;
    public bool IsPrimary { get; set; }
    public bool IsActive { get; set; }
}
