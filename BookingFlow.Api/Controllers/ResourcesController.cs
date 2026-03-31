using BookingFlow.Api.Contract.Availability;
using BookingFlow.Api.Contract.ResourceRequest;
using BookingFlow.Api.Data;
using BookingFlow.Api.Extensions;
using BookingFlow.Api.Services;
using BookingFlow.Domain.Entity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookingFlow.Api.Controllers;

[ApiController]
public sealed class ResourcesController(
    ApplicationDbContext dbContext,
    AvailabilityService availabilityService) : ControllerBase
{
    private readonly ApplicationDbContext _dbContext = dbContext;
    private readonly AvailabilityService _availabilityService = availabilityService;

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
            .Where(x => x.OrganizationId == organizationId)
            .AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(x => x.IsActive);
        }

        var resources = await query
            .OrderBy(x => x.Name)
            .Select(x => new ResourceResponse
            {
                Id = x.Id,
                OrganizationId = x.OrganizationId,
                OrganizationName = x.Organization.Name,
                Name = x.Name,
                Type = x.Type,
                Description = x.Description,
                Capacity = x.Capacity,
                SlotSizeMinutes = x.SlotSizeMinutes,
                IsActive = x.IsActive,
                AvailabilityRulesCount = x.AvailabilityRules.Count(y => y.IsActive)
            })
            .ToListAsync(cancellationToken);

        return Ok(resources);
    }

    [HttpGet("api/resources/{resourceId:guid}")]
    public async Task<ActionResult<ResourceResponse>> GetResourceById(Guid resourceId, CancellationToken cancellationToken)
    {
        var resource = await _dbContext.Resources
            .AsNoTracking()
            .Where(x => x.Id == resourceId)
            .Select(x => new ResourceResponse
            {
                Id = x.Id,
                OrganizationId = x.OrganizationId,
                OrganizationName = x.Organization.Name,
                Name = x.Name,
                Type = x.Type,
                Description = x.Description,
                Capacity = x.Capacity,
                SlotSizeMinutes = x.SlotSizeMinutes,
                IsActive = x.IsActive,
                AvailabilityRulesCount = x.AvailabilityRules.Count(y => y.IsActive)
            })
            .SingleOrDefaultAsync(cancellationToken);

        return resource is null ? NotFound() : Ok(resource);
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

        var resource = new Resource
        {
            OrganizationId = organizationId,
            Name = request.Name.Trim(),
            Type = request.Type,
            Description = request.Description?.Trim(),
            Capacity = request.Capacity,
            SlotSizeMinutes = request.SlotSizeMinutes,
            IsActive = true
        };

        _dbContext.Resources.Add(resource);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(
            nameof(GetResourceById),
            new { resourceId = resource.Id },
            ToResponse(resource, organization.Name));
    }

    [Authorize(Roles = AuthorizationRoles.AdminOrManager)]
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
            .SingleOrDefaultAsync(x => x.Id == resourceId, cancellationToken);

        if (resource is null)
        {
            return NotFound();
        }

        resource.Name = request.Name.Trim();
        resource.Type = request.Type;
        resource.Description = request.Description?.Trim();
        resource.Capacity = request.Capacity;
        resource.SlotSizeMinutes = request.SlotSizeMinutes;
        resource.IsActive = request.IsActive;
        resource.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(ToResponse(resource, resource.Organization.Name));
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

    [Authorize(Roles = AuthorizationRoles.AdminOrManager)]
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

        var resourceExists = await _dbContext.Resources.AnyAsync(x => x.Id == resourceId, cancellationToken);
        if (!resourceExists)
        {
            return NotFound();
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

    private static ResourceResponse ToResponse(Resource resource, string organizationName)
    {
        return new ResourceResponse
        {
            Id = resource.Id,
            OrganizationId = resource.OrganizationId,
            OrganizationName = organizationName,
            Name = resource.Name,
            Type = resource.Type,
            Description = resource.Description,
            Capacity = resource.Capacity,
            SlotSizeMinutes = resource.SlotSizeMinutes,
            IsActive = resource.IsActive,
            AvailabilityRulesCount = resource.AvailabilityRules.Count(x => x.IsActive)
        };
    }
}
