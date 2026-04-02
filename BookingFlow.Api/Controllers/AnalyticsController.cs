using BookingFlow.Api.Contract.Analytics;
using BookingFlow.Api.Data;
using BookingFlow.Api.Extensions;
using BookingFlow.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookingFlow.Api.Controllers;

[ApiController]
public sealed class AnalyticsController(
    ApplicationDbContext dbContext,
    AccessControlService accessControlService,
    OrganizationAnalyticsService organizationAnalyticsService) : ControllerBase
{
    private readonly ApplicationDbContext _dbContext = dbContext;
    private readonly AccessControlService _accessControlService = accessControlService;
    private readonly OrganizationAnalyticsService _organizationAnalyticsService = organizationAnalyticsService;

    [HttpPost("api/analytics/views")]
    public async Task<ActionResult> TrackView(TrackAnalyticsViewRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.VisitorId))
        {
            return BadRequest(new { message = "Visitor id is required." });
        }

        await _organizationAnalyticsService.TrackViewAsync(
            request,
            User,
            Request.Headers.UserAgent.ToString(),
            cancellationToken);

        return Accepted();
    }

    [Authorize(Roles = AuthorizationRoles.AdminOrManager)]
    [HttpGet("api/organizations/{organizationId:guid}/analytics")]
    public async Task<ActionResult<OrganizationAnalyticsResponse>> GetOrganizationAnalytics(
        Guid organizationId,
        [FromQuery] DateTimeOffset? fromUtc,
        [FromQuery] DateTimeOffset? toUtc,
        [FromQuery] int forecastDays = 30,
        CancellationToken cancellationToken = default)
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

        var from = fromUtc?.ToUniversalTime() ?? BookingFlowClock.UtcNow.AddDays(-30);
        var to = toUtc?.ToUniversalTime() ?? BookingFlowClock.UtcNow;
        var subscription = await _organizationAnalyticsService.GetSubscriptionEntityAsync(organizationId, cancellationToken);

        if (!User.IsInRole(AuthorizationRoles.Admin) &&
            !OrganizationAnalyticsService.IsSubscriptionActive(subscription, BookingFlowClock.UtcNow))
        {
            return Ok(new OrganizationAnalyticsResponse
            {
                HasAccess = false,
                AccessMessage = "Analytics is available with an active organization subscription.",
                FromUtc = from,
                ToUtc = to,
                ForecastDays = Math.Clamp(forecastDays, 1, 180),
                Subscription = subscription is null ? null : OrganizationAnalyticsService.ToSubscriptionResponse(subscription)
            });
        }

        return Ok(await _organizationAnalyticsService.GetOrganizationAnalyticsAsync(
            organizationId,
            from,
            to,
            forecastDays,
            cancellationToken));
    }
}
