using BookingFlow.Domain.Enum;

namespace BookingFlow.Api.Contract.Provider;

public sealed class ReviewProviderOrganizationJoinRequestRequest
{
    public ProviderOrganizationJoinRequestStatus Status { get; set; }
    public string? Title { get; set; }
    public bool IsPrimary { get; set; }
    public string? Note { get; set; }
}
