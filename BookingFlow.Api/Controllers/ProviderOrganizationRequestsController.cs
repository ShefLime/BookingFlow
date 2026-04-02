using BookingFlow.Api.Contract.Provider;
using BookingFlow.Api.Data;
using BookingFlow.Api.Extensions;
using BookingFlow.Api.Services;
using BookingFlow.Domain.Entity;
using BookingFlow.Domain.Enum;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookingFlow.Api.Controllers;

[ApiController]
public sealed class ProviderOrganizationRequestsController(
    ApplicationDbContext dbContext,
    AccessControlService accessControlService) : ControllerBase
{
    private readonly ApplicationDbContext _dbContext = dbContext;
    private readonly AccessControlService _accessControlService = accessControlService;

    [Authorize(Roles = AuthorizationRoles.Provider)]
    [HttpGet("api/provider/organization-requests")]
    public async Task<ActionResult<IReadOnlyCollection<ProviderOrganizationJoinRequestResponse>>> GetMyOrganizationRequests(
        CancellationToken cancellationToken)
    {
        var providerProfile = await _dbContext.ProviderProfiles
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.UserId == User.GetRequiredUserId(), cancellationToken);

        if (providerProfile is null)
        {
            return Ok(Array.Empty<ProviderOrganizationJoinRequestResponse>());
        }

        var requests = (await _dbContext.ProviderOrganizationJoinRequests
                .AsNoTracking()
                .Include(x => x.Organization)
                .Where(x => x.ProviderProfileId == providerProfile.Id)
                .ToListAsync(cancellationToken))
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToList();

        var affiliations = await _dbContext.ProviderOrganizationAffiliations
            .AsNoTracking()
            .Include(x => x.Organization)
            .Where(x => x.ProviderProfileId == providerProfile.Id)
            .ToListAsync(cancellationToken);

        return Ok(requests.Select(request => ToResponse(
            request,
            providerProfile.DisplayName,
            affiliations.SingleOrDefault(x => x.OrganizationId == request.OrganizationId && x.IsActive)))
            .ToList());
    }

    [Authorize(Roles = AuthorizationRoles.Provider)]
    [HttpPost("api/provider/organization-requests")]
    public async Task<ActionResult<ProviderOrganizationJoinRequestResponse>> CreateOrganizationJoinRequest(
        CreateProviderOrganizationJoinRequestRequest request,
        CancellationToken cancellationToken)
    {
        var providerProfile = await _dbContext.ProviderProfiles
            .SingleOrDefaultAsync(x => x.UserId == User.GetRequiredUserId(), cancellationToken);

        if (providerProfile is null)
        {
            return BadRequest(new { message = "Create your provider profile first." });
        }

        var organization = await _dbContext.Organizations
            .SingleOrDefaultAsync(x => x.Id == request.OrganizationId && x.IsActive, cancellationToken);

        if (organization is null)
        {
            return NotFound();
        }

        var hasActiveAffiliation = await _dbContext.ProviderOrganizationAffiliations
            .AsNoTracking()
            .AnyAsync(
                x => x.ProviderProfileId == providerProfile.Id && x.OrganizationId == organization.Id && x.IsActive,
                cancellationToken);

        if (hasActiveAffiliation)
        {
            return BadRequest(new { message = "You are already attached to this organization." });
        }

        var hasPendingRequest = await _dbContext.ProviderOrganizationJoinRequests
            .AsNoTracking()
            .AnyAsync(
                x =>
                    x.ProviderProfileId == providerProfile.Id &&
                    x.OrganizationId == organization.Id &&
                    x.Status == ProviderOrganizationJoinRequestStatus.Pending,
                cancellationToken);

        if (hasPendingRequest)
        {
            return BadRequest(new { message = "A pending request already exists for this organization." });
        }

        var joinRequest = new ProviderOrganizationJoinRequest
        {
            ProviderProfileId = providerProfile.Id,
            OrganizationId = organization.Id,
            Message = request.Message?.Trim(),
            Status = ProviderOrganizationJoinRequestStatus.Pending
        };

        _dbContext.ProviderOrganizationJoinRequests.Add(joinRequest);
        await _dbContext.SaveChangesAsync(cancellationToken);

        joinRequest.Organization = organization;
        joinRequest.ProviderProfile = providerProfile;

        return Created(
            $"/api/provider/organization-requests/{joinRequest.Id}",
            ToResponse(joinRequest, providerProfile.DisplayName, null));
    }

    [Authorize(Roles = AuthorizationRoles.AdminOrManager)]
    [HttpGet("api/organizations/{organizationId:guid}/provider-join-requests")]
    public async Task<ActionResult<IReadOnlyCollection<ProviderOrganizationJoinRequestResponse>>> GetOrganizationJoinRequests(
        Guid organizationId,
        [FromQuery] ProviderOrganizationJoinRequestStatus? status,
        CancellationToken cancellationToken)
    {
        var canManage = await _accessControlService.CanManageOrganizationAsync(User, organizationId, cancellationToken);
        if (!canManage)
        {
            return Forbid();
        }

        var query = _dbContext.ProviderOrganizationJoinRequests
            .AsNoTracking()
            .Include(x => x.Organization)
            .Include(x => x.ProviderProfile)
            .Where(x => x.OrganizationId == organizationId)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(x => x.Status == status.Value);
        }

        var requests = (await query
                .ToListAsync(cancellationToken))
            .OrderByDescending(x => x.CreatedAtUtc)
            .ToList();

        var affiliations = await _dbContext.ProviderOrganizationAffiliations
            .AsNoTracking()
            .Include(x => x.Organization)
            .Where(x => x.OrganizationId == organizationId)
            .ToListAsync(cancellationToken);

        return Ok(requests.Select(request => ToResponse(
            request,
            request.ProviderProfile.DisplayName,
            affiliations.SingleOrDefault(x => x.ProviderProfileId == request.ProviderProfileId && x.IsActive)))
            .ToList());
    }

    [Authorize(Roles = AuthorizationRoles.AdminOrManager)]
    [HttpPost("api/organizations/{organizationId:guid}/provider-join-requests/{requestId:guid}/review")]
    public async Task<ActionResult<ProviderOrganizationJoinRequestResponse>> ReviewOrganizationJoinRequest(
        Guid organizationId,
        Guid requestId,
        ReviewProviderOrganizationJoinRequestRequest request,
        CancellationToken cancellationToken)
    {
        var canManage = await _accessControlService.CanManageOrganizationAsync(User, organizationId, cancellationToken);
        if (!canManage)
        {
            return Forbid();
        }

        var joinRequest = await _dbContext.ProviderOrganizationJoinRequests
            .Include(x => x.Organization)
            .Include(x => x.ProviderProfile)
            .SingleOrDefaultAsync(
                x => x.Id == requestId && x.OrganizationId == organizationId,
                cancellationToken);

        if (joinRequest is null)
        {
            return NotFound();
        }

        joinRequest.Status = request.Status;
        joinRequest.ReviewNote = request.Note?.Trim();
        joinRequest.ReviewedByUserId = User.GetRequiredUserId();
        joinRequest.ReviewedAtUtc = BookingFlowClock.UtcNow;
        joinRequest.UpdatedAtUtc = BookingFlowClock.UtcNow;

        ProviderOrganizationAffiliation? affiliation = null;
        if (request.Status == ProviderOrganizationJoinRequestStatus.Approved)
        {
            affiliation = await _dbContext.ProviderOrganizationAffiliations
                .Include(x => x.Organization)
                .SingleOrDefaultAsync(
                    x => x.ProviderProfileId == joinRequest.ProviderProfileId && x.OrganizationId == organizationId,
                    cancellationToken);

            if (affiliation is null)
            {
                affiliation = new ProviderOrganizationAffiliation
                {
                    ProviderProfileId = joinRequest.ProviderProfileId,
                    OrganizationId = organizationId,
                    Title = string.IsNullOrWhiteSpace(request.Title) ? "Resident Provider" : request.Title.Trim(),
                    IsPrimary = request.IsPrimary,
                    IsActive = true
                };

                _dbContext.ProviderOrganizationAffiliations.Add(affiliation);
            }
            else
            {
                affiliation.Title = string.IsNullOrWhiteSpace(request.Title) ? affiliation.Title : request.Title.Trim();
                affiliation.IsPrimary = request.IsPrimary;
                affiliation.IsActive = true;
                affiliation.UpdatedAtUtc = BookingFlowClock.UtcNow;
            }
        }

        if (request.Status == ProviderOrganizationJoinRequestStatus.Rejected)
        {
            affiliation = await _dbContext.ProviderOrganizationAffiliations
                .Include(x => x.Organization)
                .SingleOrDefaultAsync(
                    x => x.ProviderProfileId == joinRequest.ProviderProfileId && x.OrganizationId == organizationId,
                    cancellationToken);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        if (affiliation is null)
        {
            affiliation = await _dbContext.ProviderOrganizationAffiliations
                .AsNoTracking()
                .Include(x => x.Organization)
                .SingleOrDefaultAsync(
                    x => x.ProviderProfileId == joinRequest.ProviderProfileId && x.OrganizationId == organizationId && x.IsActive,
                    cancellationToken);
        }

        return Ok(ToResponse(joinRequest, joinRequest.ProviderProfile.DisplayName, affiliation));
    }

    private static ProviderOrganizationJoinRequestResponse ToResponse(
        ProviderOrganizationJoinRequest request,
        string providerDisplayName,
        ProviderOrganizationAffiliation? affiliation)
    {
        return new ProviderOrganizationJoinRequestResponse
        {
            Id = request.Id,
            ProviderProfileId = request.ProviderProfileId,
            ProviderDisplayName = providerDisplayName,
            OrganizationId = request.OrganizationId,
            OrganizationName = request.Organization.Name,
            Message = request.Message,
            Status = request.Status,
            ReviewNote = request.ReviewNote,
            CreatedAtUtc = request.CreatedAtUtc,
            ReviewedAtUtc = request.ReviewedAtUtc,
            Affiliation = affiliation is null ? null : OrganizationAnalyticsService.ToAffiliationResponse(affiliation)
        };
    }
}
