using BookingFlow.Domain.Enum;

namespace BookingFlow.Api.Contract.Admin;

public sealed class AdminUserResponse
{
    public Guid Id { get; set; }
    public string Email { get; set; } = null!;
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string? Phone { get; set; }
    public IReadOnlyCollection<UserRole> Roles { get; set; } = Array.Empty<UserRole>();
    public bool HasProviderProfile { get; set; }
    public bool IsActive { get; set; }
}
