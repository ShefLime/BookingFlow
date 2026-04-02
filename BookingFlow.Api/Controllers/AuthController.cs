using BookingFlow.Api.Contract.Auth;
using BookingFlow.Api.Data;
using BookingFlow.Api.Extensions;
using BookingFlow.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookingFlow.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(
    ApplicationDbContext dbContext,
    UserProvisioningService userProvisioningService) : ControllerBase
{
    private readonly ApplicationDbContext _dbContext = dbContext;
    private readonly UserProvisioningService _userProvisioningService = userProvisioningService;

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<CurrentUserResponse>> GetCurrentUser(CancellationToken cancellationToken)
    {
        var localUser = await _dbContext.Users
            .AsNoTracking()
            .Include(x => x.OrganizationMemberships.Where(y => y.IsActive))
                .ThenInclude(x => x.Organization)
            .Include(x => x.ProviderProfile)
            .SingleOrDefaultAsync(x => x.Id == User.GetRequiredUserId(), cancellationToken);

        if (localUser is null)
        {
            return Unauthorized(new { message = "Current user profile was not found." });
        }

        var roles = _userProvisioningService.GetEffectiveRoles(localUser);

        return Ok(new CurrentUserResponse
        {
            UserId = localUser.Id,
            KeycloakSubject = localUser.KeycloakSubject,
            Email = localUser.Email,
            FirstName = localUser.FirstName,
            LastName = localUser.LastName,
            Phone = localUser.Phone,
            Roles = roles,
            Memberships = localUser.OrganizationMemberships
                .OrderBy(x => x.Organization.Name)
                .Select(x => new UserMembershipResponse
                {
                    OrganizationId = x.OrganizationId,
                    OrganizationName = x.Organization.Name,
                    Title = x.Title
                })
                .ToArray(),
            ProviderProfile = localUser.ProviderProfile is null
                ? null
                : new CurrentProviderProfileSummary
                {
                    Id = localUser.ProviderProfile.Id,
                    DisplayName = localUser.ProviderProfile.DisplayName,
                    ApprovalStatus = localUser.ProviderProfile.ApprovalStatus
                }
        });
    }
}
