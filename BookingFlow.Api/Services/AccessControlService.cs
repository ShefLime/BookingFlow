using System.Security.Claims;
using BookingFlow.Api.Data;
using BookingFlow.Api.Extensions;
using BookingFlow.Domain.Entity;
using Microsoft.EntityFrameworkCore;

namespace BookingFlow.Api.Services;

public sealed class AccessControlService(ApplicationDbContext dbContext)
{
    private readonly ApplicationDbContext _dbContext = dbContext;

    public async Task<bool> CanManageOrganizationAsync(
        ClaimsPrincipal principal,
        Guid organizationId,
        CancellationToken cancellationToken = default)
    {
        if (principal.IsInRole(AuthorizationRoles.Admin))
        {
            return true;
        }

        if (!principal.IsInRole(AuthorizationRoles.Manager))
        {
            return false;
        }

        var userId = principal.GetRequiredUserId();

        return await _dbContext.OrganizationMemberships
            .AsNoTracking()
            .AnyAsync(
                x => x.UserId == userId && x.OrganizationId == organizationId && x.IsActive,
                cancellationToken);
    }

    public async Task<bool> CanAccessOrganizationAnalyticsAsync(
        ClaimsPrincipal principal,
        Guid organizationId,
        CancellationToken cancellationToken = default)
    {
        if (principal.IsInRole(AuthorizationRoles.Admin))
        {
            return true;
        }

        var canManage = await CanManageOrganizationAsync(principal, organizationId, cancellationToken);
        if (!canManage)
        {
            return false;
        }

        var subscription = await _dbContext.OrganizationSubscriptions
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.OrganizationId == organizationId, cancellationToken);

        return OrganizationAnalyticsService.IsSubscriptionActive(subscription, BookingFlowClock.UtcNow);
    }

    public async Task<bool> CanManageResourceAsync(
        ClaimsPrincipal principal,
        Resource resource,
        CancellationToken cancellationToken = default)
    {
        if (principal.IsInRole(AuthorizationRoles.Admin))
        {
            return true;
        }

        if (resource.OrganizationId.HasValue)
        {
            return await CanManageOrganizationAsync(principal, resource.OrganizationId.Value, cancellationToken);
        }

        if (resource.ProviderProfileId.HasValue)
        {
            return await CanManageProviderProfileAsync(principal, resource.ProviderProfileId.Value, cancellationToken);
        }

        return false;
    }

    public async Task<bool> CanManageProviderProfileAsync(
        ClaimsPrincipal principal,
        Guid providerProfileId,
        CancellationToken cancellationToken = default)
    {
        if (principal.IsInRole(AuthorizationRoles.Admin))
        {
            return true;
        }

        var userId = principal.GetRequiredUserId();

        return await _dbContext.ProviderProfiles
            .AsNoTracking()
            .AnyAsync(x => x.Id == providerProfileId && x.UserId == userId, cancellationToken);
    }
}
