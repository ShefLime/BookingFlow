using BookingFlow.Api.Contract.Organization;
using BookingFlow.Api.Data;
using BookingFlow.Api.Extensions;
using BookingFlow.Api.Services;
using BookingFlow.Domain.Entity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookingFlow.Api.Controllers;

[ApiController]
public sealed class OrganizationSubscriptionController(
    ApplicationDbContext dbContext,
    AccessControlService accessControlService) : ControllerBase
{
    private readonly ApplicationDbContext _dbContext = dbContext;
    private readonly AccessControlService _accessControlService = accessControlService;

    [Authorize(Roles = AuthorizationRoles.AdminOrManager)]
    [HttpGet("api/organizations/{organizationId:guid}/subscription")]
    public async Task<ActionResult<OrganizationSubscriptionResponse?>> GetSubscription(
        Guid organizationId,
        CancellationToken cancellationToken)
    {
        var organizationExists = await _dbContext.Organizations
            .AsNoTracking()
            .AnyAsync(x => x.Id == organizationId, cancellationToken);

        if (!organizationExists)
        {
            return NotFound();
        }

        var canManage = await _accessControlService.CanManageOrganizationAsync(User, organizationId, cancellationToken);
        if (!canManage)
        {
            return Forbid();
        }

        var subscription = await _dbContext.OrganizationSubscriptions
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.OrganizationId == organizationId, cancellationToken);

        return Ok(subscription is null ? null : OrganizationAnalyticsService.ToSubscriptionResponse(subscription));
    }

    [Authorize(Roles = AuthorizationRoles.Admin)]
    [HttpPut("api/organizations/{organizationId:guid}/subscription")]
    public async Task<ActionResult<OrganizationSubscriptionResponse>> UpsertSubscription(
        Guid organizationId,
        UpsertOrganizationSubscriptionRequest request,
        CancellationToken cancellationToken)
    {
        var organizationExists = await _dbContext.Organizations
            .AsNoTracking()
            .AnyAsync(x => x.Id == organizationId, cancellationToken);

        if (!organizationExists)
        {
            return NotFound();
        }

        var subscription = await _dbContext.OrganizationSubscriptions
            .SingleOrDefaultAsync(x => x.OrganizationId == organizationId, cancellationToken);

        if (subscription is null)
        {
            subscription = new OrganizationSubscription
            {
                OrganizationId = organizationId
            };

            _dbContext.OrganizationSubscriptions.Add(subscription);
        }

        subscription.Plan = request.Plan;
        subscription.IsAnalyticsEnabled = request.IsAnalyticsEnabled;
        subscription.StartsAtUtc = request.StartsAtUtc.ToUniversalTime();
        subscription.EndsAtUtc = request.EndsAtUtc?.ToUniversalTime();
        subscription.MonthlyPrice = request.MonthlyPrice;
        subscription.Currency = string.IsNullOrWhiteSpace(request.Currency) ? "USD" : request.Currency.Trim().ToUpperInvariant();
        subscription.UpdatedAtUtc = BookingFlowClock.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(OrganizationAnalyticsService.ToSubscriptionResponse(subscription));
    }
}
