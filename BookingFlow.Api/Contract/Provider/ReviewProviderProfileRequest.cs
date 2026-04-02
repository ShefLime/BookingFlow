using BookingFlow.Domain.Enum;

namespace BookingFlow.Api.Contract.Provider;

public sealed class ReviewProviderProfileRequest
{
    public ModerationStatus Status { get; set; }
    public string? Note { get; set; }
}
