using BookingFlow.Api.Contract.Organization;
using BookingFlow.Api.Data;
using BookingFlow.Api.Extensions;
using BookingFlow.Api.Models.Content;
using BookingFlow.Domain.Entity;
using BookingFlow.Domain.Enum;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BookingFlow.Api.Controllers;

[ApiController]
[Route("api/organizations")]
public sealed class OrganizationsController(ApplicationDbContext dbContext) : ControllerBase
{
    private readonly ApplicationDbContext _dbContext = dbContext;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<OrganizationResponse>>> GetOrganizations(
        [FromQuery] OrganizationType? type,
        [FromQuery] bool includeInactive,
        CancellationToken cancellationToken)
    {
        var query = _dbContext.Organizations.AsNoTracking().AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(x => x.IsActive);
        }

        if (type.HasValue)
        {
            query = query.Where(x => x.Type == type.Value);
        }

        var organizations = await query
            .OrderBy(x => x.Name)
            .Select(x => new OrganizationResponse
            {
                Id = x.Id,
                Name = x.Name,
                Type = x.Type,
                Description = x.Description,
                TimeZone = x.TimeZone,
                Address = x.Address,
                City = x.City,
                Phone = x.Phone,
                Email = x.Email,
                WebsiteUrl = x.WebsiteUrl,
                LogoImageUrl = x.LogoImageUrl,
                CoverImageUrl = x.CoverImageUrl,
                Gallery = StructuredContentSerializer.DeserializeOrDefault<List<MediaAssetItem>>(x.GalleryJson),
                Documents = StructuredContentSerializer.DeserializeOrDefault<List<MediaAssetItem>>(x.DocumentsJson),
                Content = StructuredContentSerializer.DeserializeOrDefault<OrganizationContent>(x.ContentJson),
                IsActive = x.IsActive,
                ResourcesCount = x.Resources.Count(y => y.IsActive),
                EventsCount = x.Events.Count(y => y.IsActive)
            })
            .ToListAsync(cancellationToken);

        return Ok(organizations);
    }

    [HttpGet("{organizationId:guid}")]
    public async Task<ActionResult<OrganizationResponse>> GetOrganizationById(Guid organizationId, CancellationToken cancellationToken)
    {
        var organization = await _dbContext.Organizations
            .AsNoTracking()
            .Where(x => x.Id == organizationId)
            .Select(x => new OrganizationResponse
            {
                Id = x.Id,
                Name = x.Name,
                Type = x.Type,
                Description = x.Description,
                TimeZone = x.TimeZone,
                Address = x.Address,
                City = x.City,
                Phone = x.Phone,
                Email = x.Email,
                WebsiteUrl = x.WebsiteUrl,
                LogoImageUrl = x.LogoImageUrl,
                CoverImageUrl = x.CoverImageUrl,
                Gallery = StructuredContentSerializer.DeserializeOrDefault<List<MediaAssetItem>>(x.GalleryJson),
                Documents = StructuredContentSerializer.DeserializeOrDefault<List<MediaAssetItem>>(x.DocumentsJson),
                Content = StructuredContentSerializer.DeserializeOrDefault<OrganizationContent>(x.ContentJson),
                IsActive = x.IsActive,
                ResourcesCount = x.Resources.Count(y => y.IsActive),
                EventsCount = x.Events.Count(y => y.IsActive)
            })
            .SingleOrDefaultAsync(cancellationToken);

        return organization is null ? NotFound() : Ok(organization);
    }

    [Authorize(Roles = AuthorizationRoles.AdminOrManager)]
    [HttpPost]
    public async Task<ActionResult<OrganizationResponse>> CreateOrganization(
        CreateOrganizationRequest request,
        CancellationToken cancellationToken)
    {
        if (!IsValidOrganizationRequest(request.Name, request.Description, request.TimeZone, request.Address))
        {
            return BadRequest(new { message = "Name, description, time zone and address are required." });
        }

        var organization = new Organization
        {
            Name = request.Name.Trim(),
            Type = request.Type,
            Description = request.Description.Trim(),
            TimeZone = request.TimeZone.Trim(),
            Address = request.Address.Trim(),
            City = request.City?.Trim(),
            Phone = request.Phone?.Trim(),
            Email = request.Email?.Trim(),
            WebsiteUrl = request.WebsiteUrl?.Trim(),
            LogoImageUrl = request.LogoImageUrl?.Trim(),
            CoverImageUrl = request.CoverImageUrl?.Trim(),
            GalleryJson = StructuredContentSerializer.Serialize(request.Gallery),
            DocumentsJson = StructuredContentSerializer.Serialize(request.Documents),
            ContentJson = StructuredContentSerializer.Serialize(request.Content),
            IsActive = true
        };

        _dbContext.Organizations.Add(organization);
        await _dbContext.SaveChangesAsync(cancellationToken);

        if (User.IsInRole(AuthorizationRoles.Manager) && !User.IsInRole(AuthorizationRoles.Admin))
        {
            _dbContext.OrganizationMemberships.Add(new OrganizationMembership
            {
                UserId = User.GetRequiredUserId(),
                OrganizationId = organization.Id,
                Title = "Manager",
                IsActive = true
            });

            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return CreatedAtAction(
            nameof(GetOrganizationById),
            new { organizationId = organization.Id },
            ToResponse(organization));
    }

    [Authorize(Roles = AuthorizationRoles.AdminOrManager)]
    [HttpPut("{organizationId:guid}")]
    public async Task<ActionResult<OrganizationResponse>> UpdateOrganization(
        Guid organizationId,
        UpdateOrganizationRequest request,
        CancellationToken cancellationToken)
    {
        if (!IsValidOrganizationRequest(request.Name, request.Description, request.TimeZone, request.Address))
        {
            return BadRequest(new { message = "Name, description, time zone and address are required." });
        }

        var organization = await _dbContext.Organizations.SingleOrDefaultAsync(x => x.Id == organizationId, cancellationToken);
        if (organization is null)
        {
            return NotFound();
        }

        if (!User.IsInRole(AuthorizationRoles.Admin))
        {
            var canManage = await _dbContext.OrganizationMemberships
                .AsNoTracking()
                .AnyAsync(
                    x => x.UserId == User.GetRequiredUserId() && x.OrganizationId == organizationId && x.IsActive,
                    cancellationToken);

            if (!canManage)
            {
                return Forbid();
            }
        }

        organization.Name = request.Name.Trim();
        organization.Type = request.Type;
        organization.Description = request.Description.Trim();
        organization.TimeZone = request.TimeZone.Trim();
        organization.Address = request.Address.Trim();
        organization.City = request.City?.Trim();
        organization.Phone = request.Phone?.Trim();
        organization.Email = request.Email?.Trim();
        organization.WebsiteUrl = request.WebsiteUrl?.Trim();
        organization.LogoImageUrl = request.LogoImageUrl?.Trim();
        organization.CoverImageUrl = request.CoverImageUrl?.Trim();
        organization.GalleryJson = StructuredContentSerializer.Serialize(request.Gallery);
        organization.DocumentsJson = StructuredContentSerializer.Serialize(request.Documents);
        organization.ContentJson = StructuredContentSerializer.Serialize(request.Content);
        organization.IsActive = request.IsActive;
        organization.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(ToResponse(organization));
    }

    private static bool IsValidOrganizationRequest(string name, string description, string timeZone, string address)
    {
        return !string.IsNullOrWhiteSpace(name) &&
               !string.IsNullOrWhiteSpace(description) &&
               !string.IsNullOrWhiteSpace(timeZone) &&
               !string.IsNullOrWhiteSpace(address);
    }

    private static OrganizationResponse ToResponse(Organization organization)
    {
        return new OrganizationResponse
        {
            Id = organization.Id,
            Name = organization.Name,
            Type = organization.Type,
            Description = organization.Description,
            TimeZone = organization.TimeZone,
            Address = organization.Address,
            City = organization.City,
            Phone = organization.Phone,
            Email = organization.Email,
            WebsiteUrl = organization.WebsiteUrl,
            LogoImageUrl = organization.LogoImageUrl,
            CoverImageUrl = organization.CoverImageUrl,
            Gallery = StructuredContentSerializer.DeserializeOrDefault<List<MediaAssetItem>>(organization.GalleryJson),
            Documents = StructuredContentSerializer.DeserializeOrDefault<List<MediaAssetItem>>(organization.DocumentsJson),
            Content = StructuredContentSerializer.DeserializeOrDefault<OrganizationContent>(organization.ContentJson),
            IsActive = organization.IsActive,
            ResourcesCount = organization.Resources.Count(x => x.IsActive),
            EventsCount = organization.Events.Count(x => x.IsActive)
        };
    }
}
