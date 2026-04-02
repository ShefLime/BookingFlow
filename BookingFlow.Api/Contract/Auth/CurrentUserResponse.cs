using BookingFlow.Domain.Enum;

namespace BookingFlow.Api.Contract.Auth;

public sealed class CurrentUserResponse
{
    public Guid UserId { get; set; }
    public string KeycloakSubject { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string? Phone { get; set; }
    public IReadOnlyCollection<UserRole> Roles { get; set; } = Array.Empty<UserRole>();
    public IReadOnlyCollection<UserMembershipResponse> Memberships { get; set; } = Array.Empty<UserMembershipResponse>();
    public CurrentProviderProfileSummary? ProviderProfile { get; set; }
}

public sealed class UserMembershipResponse
{
    public Guid OrganizationId { get; set; }
    public string OrganizationName { get; set; } = null!;
    public string Title { get; set; } = null!;
}

public sealed class CurrentProviderProfileSummary
{
    public Guid Id { get; set; }
    public string DisplayName { get; set; } = null!;
    public ModerationStatus ApprovalStatus { get; set; }
}
