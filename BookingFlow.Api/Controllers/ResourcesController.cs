using BookingFlow.Api.Contract.Availability;
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
public sealed class ResourcesController(
    ApplicationDbContext dbContext,
    AvailabilityService availabilityService,
    AccessControlService accessControlService) : ControllerBase
{
    private readonly ApplicationDbContext _dbContext = dbContext;
    private readonly AvailabilityService _availabilityService = availabilityService;
    private readonly AccessControlService _accessControlService = accessControlService;

    [HttpGet("api/resources/discover")]
    public async Task<ActionResult<IReadOnlyCollection<ResourceResponse>>> DiscoverResources(
        [FromQuery] string? ownerType,
        CancellationToken cancellationToken)
    {
        var query = _dbContext.Resources
            .AsNoTracking()
            .Include(x => x.Organization)
            .Include(x => x.ProviderProfile)
            .Include(x => x.AvailabilityRules)
            .Where(x => x.IsActive)
            .AsQueryable();

        if (string.Equals(ownerType, "provider", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(x =>
                x.ProviderProfileId != null &&
                x.ApprovalStatus == ModerationStatus.Approved &&
                x.ProviderProfile != null &&
                x.ProviderProfile.ApprovalStatus == ModerationStatus.Approved);
        }
        else if (string.Equals(ownerType, "organization", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(x =>
                x.OrganizationId != null &&
                x.Organization != null &&
                x.Organization.IsActive);
        }

        var resources = await query
            .OrderBy(x => x.Name)
            .ToListAsync(cancellationToken);

        return Ok(resources
            .Where(IsPubliclyVisible)
            .Select(ToResponse)
            .ToList());
    }

    [HttpGet("api/organizations/{organizationId:guid}/resources")]
    public async Task<ActionResult<IReadOnlyCollection<ResourceResponse>>> GetResources(
        Guid organizationId,
        [FromQuery] bool includeInactive,
        CancellationToken cancellationToken)
    {
        var organizationExists = await _dbContext.Organizations
            .AsNoTracking()
            .AnyAsync(x => x.Id == organizationId, cancellationToken);

        if (!organizationExists)
        {
            return NotFound();
        }

        var query = _dbContext.Resources
            .AsNoTracking()
            .Include(x => x.Organization)
            .Include(x => x.ProviderProfile)
            .Include(x => x.AvailabilityRules)
            .Where(x => x.OrganizationId == organizationId)
            .AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(x => x.IsActive);
        }

        var resources = await query
            .OrderBy(x => x.Name)
            .ToListAsync(cancellationToken);

        return Ok(resources.Select(ToResponse).ToList());
    }

    [HttpGet("api/resources/{resourceId:guid}")]
    public async Task<ActionResult<ResourceResponse>> GetResourceById(Guid resourceId, CancellationToken cancellationToken)
    {
        var resource = await _dbContext.Resources
            .AsNoTracking()
            .Include(x => x.Organization)
            .Include(x => x.ProviderProfile)
            .Include(x => x.AvailabilityRules)
            .SingleOrDefaultAsync(x => x.Id == resourceId, cancellationToken);

        if (resource is null)
        {
            return NotFound();
        }

        return Ok(ToResponse(resource));
    }

    [Authorize(Roles = AuthorizationRoles.AdminOrManager)]
    [HttpPost("api/organizations/{organizationId:guid}/resources")]
    public async Task<ActionResult<ResourceResponse>> CreateResource(
        Guid organizationId,
        CreateResourceRequest request,
        CancellationToken cancellationToken)
    {
        if (organizationId != request.OrganizationId)
        {
            return BadRequest(new { message = "Organization id in route and body must match." });
        }

        if (!IsValidResourceRequest(request.Name, request.Capacity, request.SlotSizeMinutes))
        {
            return BadRequest(new { message = "Name is required. Capacity and slot size must be positive." });
        }

        var organization = await _dbContext.Organizations.SingleOrDefaultAsync(x => x.Id == organizationId, cancellationToken);
        if (organization is null)
        {
            return NotFound();
        }

        var canManage = await _accessControlService.CanManageOrganizationAsync(User, organizationId, cancellationToken);
        if (!canManage)
        {
            return Forbid();
        }

        var resource = new Resource
        {
            OrganizationId = organizationId,
            Name = request.Name.Trim(),
            Type = request.Type,
            Description = request.Description?.Trim(),
            Location = request.Location?.Trim(),
            Capacity = request.Capacity,
            SlotSizeMinutes = request.SlotSizeMinutes,
            ExperienceYears = request.ExperienceYears,
            PriceFrom = request.PriceFrom,
            AvatarImageUrl = request.AvatarImageUrl?.Trim(),
            CoverImageUrl = request.CoverImageUrl?.Trim(),
            GalleryJson = StructuredContentSerializer.Serialize(request.Gallery),
            DocumentsJson = StructuredContentSerializer.Serialize(request.Documents),
            ContentJson = StructuredContentSerializer.Serialize(request.Content),
            ApprovalStatus = ModerationStatus.Approved,
            IsActive = true
        };

        _dbContext.Resources.Add(resource);
        await _dbContext.SaveChangesAsync(cancellationToken);

        resource.Organization = organization;

        return CreatedAtAction(
            nameof(GetResourceById),
            new { resourceId = resource.Id },
            ToResponse(resource));
    }

    [Authorize]
    [HttpPut("api/resources/{resourceId:guid}")]
    public async Task<ActionResult<ResourceResponse>> UpdateResource(
        Guid resourceId,
        UpdateResourceRequest request,
        CancellationToken cancellationToken)
    {
        if (!IsValidResourceRequest(request.Name, request.Capacity, request.SlotSizeMinutes))
        {
            return BadRequest(new { message = "Name is required. Capacity and slot size must be positive." });
        }

        var resource = await _dbContext.Resources
            .Include(x => x.Organization)
            .Include(x => x.ProviderProfile)
            .Include(x => x.AvailabilityRules)
            .SingleOrDefaultAsync(x => x.Id == resourceId, cancellationToken);

        if (resource is null)
        {
            return NotFound();
        }

        var canManage = await _accessControlService.CanManageResourceAsync(User, resource, cancellationToken);
        if (!canManage)
        {
            return Forbid();
        }

        resource.Name = request.Name.Trim();
        resource.Type = request.Type;
        resource.Description = request.Description?.Trim();
        resource.Location = request.Location?.Trim();
        resource.Capacity = request.Capacity;
        resource.SlotSizeMinutes = request.SlotSizeMinutes;
        resource.ExperienceYears = request.ExperienceYears;
        resource.PriceFrom = request.PriceFrom;
        resource.AvatarImageUrl = request.AvatarImageUrl?.Trim();
        resource.CoverImageUrl = request.CoverImageUrl?.Trim();
        resource.GalleryJson = StructuredContentSerializer.Serialize(request.Gallery);
        resource.DocumentsJson = StructuredContentSerializer.Serialize(request.Documents);
        resource.ContentJson = StructuredContentSerializer.Serialize(request.Content);
        resource.IsActive = request.IsActive;
        resource.UpdatedAtUtc = DateTimeOffset.UtcNow;

        if (resource.ProviderProfileId.HasValue && !User.IsInRole(AuthorizationRoles.Admin))
        {
            resource.ApprovalStatus = ModerationStatus.PendingApproval;
            resource.ModerationNote = null;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(ToResponse(resource));
    }

    [HttpGet("api/resources/{resourceId:guid}/availability-rules")]
    public async Task<ActionResult<IReadOnlyCollection<AvailabilityRuleResponse>>> GetAvailabilityRules(
        Guid resourceId,
        CancellationToken cancellationToken)
    {
        var resourceExists = await _dbContext.Resources.AsNoTracking().AnyAsync(x => x.Id == resourceId, cancellationToken);
        if (!resourceExists)
        {
            return NotFound();
        }

        var rules = await _dbContext.AvailabilityRules
            .AsNoTracking()
            .Where(x => x.ResourceId == resourceId)
            .OrderBy(x => x.DayOfWeek)
            .ThenBy(x => x.StartTime)
            .Select(x => new AvailabilityRuleResponse
            {
                Id = x.Id,
                ResourceId = x.ResourceId,
                DayOfWeek = x.DayOfWeek,
                StartTime = x.StartTime,
                EndTime = x.EndTime,
                IsActive = x.IsActive
            })
            .ToListAsync(cancellationToken);

        return Ok(rules);
    }

    [Authorize]
    [HttpPost("api/resources/{resourceId:guid}/availability-rules")]
    public async Task<ActionResult<AvailabilityRuleResponse>> CreateAvailabilityRule(
        Guid resourceId,
        SetAvailabilityRuleRequest request,
        CancellationToken cancellationToken)
    {
        if (resourceId != request.ResourceId)
        {
            return BadRequest(new { message = "Resource id in route and body must match." });
        }

        if (request.StartTime >= request.EndTime)
        {
            return BadRequest(new { message = "StartTime must be earlier than EndTime." });
        }

        var resource = await _dbContext.Resources
            .AsNoTracking()
            .Include(x => x.Organization)
            .Include(x => x.ProviderProfile)
            .SingleOrDefaultAsync(x => x.Id == resourceId, cancellationToken);

        if (resource is null)
        {
            return NotFound();
        }

        var canManage = await _accessControlService.CanManageResourceAsync(User, resource, cancellationToken);
        if (!canManage)
        {
            return Forbid();
        }

        var rule = new AvailabilityRule
        {
            ResourceId = resourceId,
            DayOfWeek = request.DayOfWeek,
            StartTime = request.StartTime,
            EndTime = request.EndTime,
            IsActive = true
        };

        _dbContext.AvailabilityRules.Add(rule);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new AvailabilityRuleResponse
        {
            Id = rule.Id,
            ResourceId = rule.ResourceId,
            DayOfWeek = rule.DayOfWeek,
            StartTime = rule.StartTime,
            EndTime = rule.EndTime,
            IsActive = rule.IsActive
        });
    }

    [HttpGet("api/resources/{resourceId:guid}/availability")]
    public async Task<ActionResult<IReadOnlyCollection<AvailableSlotResponse>>> GetAvailability(
        Guid resourceId,
        [FromQuery] DateOnly date,
        CancellationToken cancellationToken)
    {
        var resourceExists = await _dbContext.Resources.AsNoTracking().AnyAsync(x => x.Id == resourceId, cancellationToken);
        if (!resourceExists)
        {
            return NotFound();
        }

        var availability = await _availabilityService.GetAvailabilityAsync(resourceId, date, cancellationToken);
        return Ok(availability);
    }

    private static bool IsValidResourceRequest(string name, int capacity, int slotSizeMinutes)
    {
        return !string.IsNullOrWhiteSpace(name) && capacity > 0 && slotSizeMinutes > 0;
    }

    private static bool IsPubliclyVisible(Resource resource)
    {
        if (!resource.IsActive)
        {
            return false;
        }

        if (resource.OrganizationId.HasValue)
        {
            return resource.Organization?.IsActive == true;
        }

        return resource.ProviderProfile?.ApprovalStatus == ModerationStatus.Approved &&
               resource.ApprovalStatus == ModerationStatus.Approved;
    }

    private static ResourceResponse ToResponse(Resource resource)
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
