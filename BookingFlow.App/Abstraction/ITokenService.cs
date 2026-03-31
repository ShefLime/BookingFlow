namespace BookingFlow.App.Abstraction;

public interface ITokenService
{
    string CreateAccessToken(Guid userId, string email);
    DateTimeOffset GetAccessTokenExpirationUtc();
}