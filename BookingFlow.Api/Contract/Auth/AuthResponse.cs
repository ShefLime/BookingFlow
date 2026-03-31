namespace BookingFlow.Api.Contract.Auth;

public sealed class AuthResponse
{
    public string AccessToken { get; set; } = null!;
    public DateTimeOffset ExpiresAtUtc { get; set; }
    public Guid UserId { get; set; }
    public string Email { get; set; } = null!;
    public string Role { get; set; } = null!;
}
