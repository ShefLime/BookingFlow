using System.Security.Claims;

namespace BookingFlow.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public const string BookingFlowUserIdClaim = "bookingflow_user_id";

    public static Guid GetRequiredUserId(this ClaimsPrincipal principal)
    {
        var rawUserId = principal.FindFirstValue(BookingFlowUserIdClaim)
                        ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(rawUserId, out var userId))
        {
            throw new UnauthorizedAccessException("Authenticated user id is missing.");
        }

        return userId;
    }
}
