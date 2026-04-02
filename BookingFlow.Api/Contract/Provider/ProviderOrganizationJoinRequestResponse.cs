using BookingFlow.Domain.Enum;

namespace BookingFlow.Api.Contract.Provider;

public sealed class ProviderOrganizationJoinRequestResponse
{
    public Guid Id { get; set; }
    public Guid ProviderProfileId { get; set; }
    public string ProviderDisplayName { get; set; } = null!;
    public Guid OrganizationId { get; set; }
    public string OrganizationName { get; set; } = null!;
    public string? Message { get; set; }
    public ProviderOrganizationJoinRequestStatus Status { get; set; }
    public string? ReviewNote { get; set; }
    public DateTimeOffset CreatedAtUtc { get; set; }
    public DateTimeOffset? ReviewedAtUtc { get; set; }
    public ProviderOrganizationAffiliationResponse? Affiliation { get; set; }
}
