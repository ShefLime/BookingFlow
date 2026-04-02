namespace BookingFlow.Api.Extensions;

public static class AuthorizationRoles
{
    public const string Admin = "Admin";
    public const string Provider = "Provider";
    public const string Manager = "Manager";
    public const string AdminOrManager = $"{Admin},{Manager}";
    public const string Client = "Client";
}
