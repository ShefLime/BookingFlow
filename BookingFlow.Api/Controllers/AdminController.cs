using BookingFlow.Api.Contract.Admin;
using BookingFlow.Api.Contract.Provider;
using BookingFlow.Api.Contract.ResourceRequest;
using BookingFlow.Api.Data;
using BookingFlow.Api.Extensions;
using BookingFlow.Api.Models.Content;
using BookingFlow.Api.Services;
using BookingFlow.Domain.Entity;
using BookingFlow.Domain.Enum;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookingFlow.Api.Controllers;

[ApiController]
[Authorize(Roles = AuthorizationRoles.Admin)]
[Route("api/admin")]
public sealed class AdminController(
    ApplicationDbContext dbContext,
    UserProvisioningService userProvisioningService) : ControllerBase
{
    private readonly ApplicationDbContext _dbContext = dbContext;
    private readonly UserProvisioningService _userProvisioningService = userProvisioningService;

    [HttpGet("users")]
    public async Task<ActionResult<IReadOnlyCollection<AdminUserResponse>>> GetUsers(CancellationToken cancellationToken)
    {
        var users = await _dbContext.Users
            .AsNoTracking()
            .Include(x => x.OrganizationMemberships.Where(y => y.IsActive))
            .Include(x => x.ProviderProfile)
            .OrderBy(x => x.Email)
            .ToListAsync(cancellationToken);

        return Ok(users.Select(x => new AdminUserResponse
        {
            Id = x.Id,
            Email = x.Email,
            FirstName = x.FirstName,
            LastName = x.LastName,
            Phone = x.Phone,
            Roles = _userProvisioningService.GetEffectiveRoles(x),
            HasProviderProfile = x.ProviderProfile is not null,
            IsActive = x.IsActive
        }).ToList());
    }

    [HttpPost("memberships")]
    public async Task<ActionResult> AssignMembership(
        AssignManagerMembershipRequest request,
        CancellationToken cancellationToken)
    {
        var userExists = await _dbContext.Users.AnyAsync(x => x.Id == request.UserId, cancellationToken);
        var organizationExists = await _dbContext.Organizations.AnyAsync(x => x.Id == request.OrganizationId, cancellationToken);

        if (!userExists || !organizationExists)
        {
            return NotFound();
        }

        var membership = await _dbContext.OrganizationMemberships
            .SingleOrDefaultAsync(
                x => x.UserId == request.UserId && x.OrganizationId == request.OrganizationId,
                cancellationToken);

        if (membership is null)
        {
            membership = new OrganizationMembership
            {
                UserId = request.UserId,
                OrganizationId = request.OrganizationId,
                Title = string.IsNullOrWhiteSpace(request.Title) ? "Manager" : request.Title.Trim(),
                IsActive = true
            };

            _dbContext.OrganizationMemberships.Add(membership);
        }
        else
        {
            membership.Title = string.IsNullOrWhiteSpace(request.Title) ? membership.Title : request.Title.Trim();
            membership.IsActive = true;
            membership.UpdatedAtUtc = DateTimeOffset.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok();
    }

    [HttpGet("provider-profiles")]
    public async Task<ActionResult<IReadOnlyCollection<ProviderProfileResponse>>> GetProviderProfiles(
        [FromQuery] ModerationStatus? status,
        CancellationToken cancellationToken)
    {
        var query = _dbContext.ProviderProfiles
            .AsNoTracking()
            .Include(x => x.Resources)
            .Include(x => x.Affiliations)
                .ThenInclude(x => x.Organization)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(x => x.ApprovalStatus == status.Value);
        }

        var profiles = await query
            .OrderBy(x => x.DisplayName)
            .ToListAsync(cancellationToken);

        return Ok(profiles.Select(ToProviderResponse).ToList());
    }

    [HttpPost("provider-profiles/{providerProfileId:guid}/review")]
    public async Task<ActionResult<ProviderProfileResponse>> ReviewProviderProfile(
        Guid providerProfileId,
        ReviewProviderProfileRequest request,
        CancellationToken cancellationToken)
    {
        var providerProfile = await _dbContext.ProviderProfiles
            .Include(x => x.Resources)
            .Include(x => x.Affiliations)
                .ThenInclude(x => x.Organization)
            .SingleOrDefaultAsync(x => x.Id == providerProfileId, cancellationToken);

        if (providerProfile is null)
        {
            return NotFound();
        }

        providerProfile.ApprovalStatus = request.Status;
        providerProfile.ModerationNote = request.Note?.Trim();
        providerProfile.ReviewedAtUtc = DateTimeOffset.UtcNow;
        providerProfile.ReviewedByUserId = User.GetRequiredUserId();
        providerProfile.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(ToProviderResponse(providerProfile));
    }

    [HttpGet("provider-resources")]
    public async Task<ActionResult<IReadOnlyCollection<ResourceResponse>>> GetProviderResources(
        [FromQuery] ModerationStatus? status,
        CancellationToken cancellationToken)
    {
        var query = _dbContext.Resources
            .AsNoTracking()
            .Include(x => x.ProviderProfile)
            .Include(x => x.AvailabilityRules)
            .Where(x => x.ProviderProfileId != null)
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(x => x.ApprovalStatus == status.Value);
        }

        var resources = await query
            .OrderBy(x => x.Name)
            .ToListAsync(cancellationToken);

        return Ok(resources.Select(ToResourceResponse).ToList());
    }

    [HttpPost("provider-resources/{resourceId:guid}/review")]
    public async Task<ActionResult<ResourceResponse>> ReviewProviderResource(
        Guid resourceId,
        ReviewProviderResourceRequest request,
        CancellationToken cancellationToken)
    {
        var resource = await _dbContext.Resources
            .Include(x => x.ProviderProfile)
            .Include(x => x.AvailabilityRules)
            .SingleOrDefaultAsync(x => x.Id == resourceId && x.ProviderProfileId != null, cancellationToken);

        if (resource is null)
        {
            return NotFound();
        }

        resource.ApprovalStatus = request.Status;
        resource.ModerationNote = request.Note?.Trim();
        resource.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(ToResourceResponse(resource));
    }

    private static ProviderProfileResponse ToProviderResponse(ProviderProfile providerProfile)
    {
        return new ProviderProfileResponse
        {
            Id = providerProfile.Id,
            UserId = providerProfile.UserId,
            DisplayName = providerProfile.DisplayName,
            Headline = providerProfile.Headline,
            City = providerProfile.City,
            TimeZone = providerProfile.TimeZone,
            Location = providerProfile.Location,
            AvatarImageUrl = providerProfile.AvatarImageUrl,
            CoverImageUrl = providerProfile.CoverImageUrl,
            Gallery = StructuredContentSerializer.DeserializeOrDefault<List<MediaAssetItem>>(providerProfile.GalleryJson),
            Documents = StructuredContentSerializer.DeserializeOrDefault<List<MediaAssetItem>>(providerProfile.DocumentsJson),
            Content = StructuredContentSerializer.DeserializeOrDefault<ProviderContent>(providerProfile.ContentJson),
            ApprovalStatus = providerProfile.ApprovalStatus,
            ModerationNote = providerProfile.ModerationNote,
            ServicesCount = providerProfile.Resources.Count(x => x.IsActive),
            Affiliations = providerProfile.Affiliations
                .Where(x => x.IsActive)
                .OrderByDescending(x => x.IsPrimary)
                .ThenBy(x => x.Organization.Name)
                .Select(OrganizationAnalyticsService.ToAffiliationResponse)
                .ToArray()
        };
    }

    private static ResourceResponse ToResourceResponse(Resource resource)
    {
        return new ResourceResponse
        {
            Id = resource.Id,
            OrganizationId = resource.OrganizationId,
            OrganizationName = resource.Organization?.Name,
            ProviderProfileId = resource.ProviderProfileId,
            ProviderDisplayName = resource.ProviderProfile?.DisplayName,
            ProviderAvatarImageUrl = resource.ProviderProfile?.AvatarImageUrl,
            Name = resource.Name,
            Type = resource.Type,
            Description = resource.Description,
            Location = resource.Location,
            Capacity = resource.Capacity,
            SlotSizeMinutes = resource.SlotSizeMinutes,
            ExperienceYears = resource.ExperienceYears,
            PriceFrom = resource.PriceFrom,
            AvatarImageUrl = resource.AvatarImageUrl,
            CoverImageUrl = resource.CoverImageUrl,
            Gallery = StructuredContentSerializer.DeserializeOrDefault<List<MediaAssetItem>>(resource.GalleryJson),
            Documents = StructuredContentSerializer.DeserializeOrDefault<List<MediaAssetItem>>(resource.DocumentsJson),
            Content = StructuredContentSerializer.DeserializeOrDefault<ResourceContent>(resource.ContentJson),
            IsActive = resource.IsActive,
            ApprovalStatus = resource.ApprovalStatus,
            ModerationNote = resource.ModerationNote,
            AvailabilityRulesCount = resource.AvailabilityRules.Count(x => x.IsActive)
        };
    }
}
