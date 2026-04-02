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
public sealed class ProviderController(ApplicationDbContext dbContext) : ControllerBase
{
    private readonly ApplicationDbContext _dbContext = dbContext;

    [HttpGet("api/providers/discover")]
    public async Task<ActionResult<IReadOnlyCollection<ProviderProfileResponse>>> DiscoverProviders(CancellationToken cancellationToken)
    {
        var providers = await _dbContext.ProviderProfiles
            .AsNoTracking()
            .Include(x => x.Resources)
            .Include(x => x.Affiliations)
                .ThenInclude(x => x.Organization)
            .Where(x => x.ApprovalStatus == ModerationStatus.Approved)
            .OrderBy(x => x.DisplayName)
            .ToListAsync(cancellationToken);

        return Ok(providers.Select(ToProviderResponse).ToList());
    }

    [HttpGet("api/providers/{providerProfileId:guid}")]
    public async Task<ActionResult<ProviderProfileResponse>> GetProviderProfile(Guid providerProfileId, CancellationToken cancellationToken)
    {
        var provider = await _dbContext.ProviderProfiles
            .AsNoTracking()
            .Include(x => x.Resources)
            .Include(x => x.Affiliations)
                .ThenInclude(x => x.Organization)
            .SingleOrDefaultAsync(x => x.Id == providerProfileId, cancellationToken);

        if (provider is null || provider.ApprovalStatus != ModerationStatus.Approved)
        {
            return NotFound();
        }

        return Ok(ToProviderResponse(provider));
    }

    [Authorize]
    [HttpGet("api/provider/profile")]
    public async Task<ActionResult<ProviderProfileResponse?>> GetMyProviderProfile(CancellationToken cancellationToken)
    {
        var profile = await _dbContext.ProviderProfiles
            .AsNoTracking()
            .Include(x => x.Resources)
            .Include(x => x.Affiliations)
                .ThenInclude(x => x.Organization)
            .SingleOrDefaultAsync(x => x.UserId == User.GetRequiredUserId(), cancellationToken);

        return Ok(profile is null ? null : ToProviderResponse(profile));
    }

    [Authorize]
    [HttpPut("api/provider/profile")]
    public async Task<ActionResult<ProviderProfileResponse>> UpsertProviderProfile(
        UpsertProviderProfileRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.DisplayName) ||
            string.IsNullOrWhiteSpace(request.Headline) ||
            string.IsNullOrWhiteSpace(request.TimeZone))
        {
            return BadRequest(new { message = "Display name, headline and time zone are required." });
        }

        var userId = User.GetRequiredUserId();
        var profile = await _dbContext.ProviderProfiles
            .Include(x => x.Resources)
            .Include(x => x.Affiliations)
                .ThenInclude(x => x.Organization)
            .SingleOrDefaultAsync(x => x.UserId == userId, cancellationToken);

        if (profile is null)
        {
            profile = new ProviderProfile
            {
                UserId = userId,
                DisplayName = request.DisplayName.Trim(),
                Headline = request.Headline.Trim(),
                City = request.City?.Trim(),
                TimeZone = request.TimeZone.Trim(),
                Location = request.Location?.Trim(),
                AvatarImageUrl = request.AvatarImageUrl?.Trim(),
                CoverImageUrl = request.CoverImageUrl?.Trim(),
                GalleryJson = StructuredContentSerializer.Serialize(request.Gallery),
                DocumentsJson = StructuredContentSerializer.Serialize(request.Documents),
                ContentJson = StructuredContentSerializer.Serialize(request.Content),
                ApprovalStatus = ModerationStatus.PendingApproval
            };

            _dbContext.ProviderProfiles.Add(profile);
        }
        else
        {
            profile.DisplayName = request.DisplayName.Trim();
            profile.Headline = request.Headline.Trim();
            profile.City = request.City?.Trim();
            profile.TimeZone = request.TimeZone.Trim();
            profile.Location = request.Location?.Trim();
            profile.AvatarImageUrl = request.AvatarImageUrl?.Trim();
            profile.CoverImageUrl = request.CoverImageUrl?.Trim();
            profile.GalleryJson = StructuredContentSerializer.Serialize(request.Gallery);
            profile.DocumentsJson = StructuredContentSerializer.Serialize(request.Documents);
            profile.ContentJson = StructuredContentSerializer.Serialize(request.Content);
            profile.UpdatedAtUtc = DateTimeOffset.UtcNow;

            if (profile.ApprovalStatus == ModerationStatus.Rejected)
            {
                profile.ApprovalStatus = ModerationStatus.PendingApproval;
                profile.ModerationNote = null;
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(ToProviderResponse(profile));
    }

    [Authorize]
    [HttpGet("api/provider/resources")]
    public async Task<ActionResult<IReadOnlyCollection<ResourceResponse>>> GetMyProviderResources(CancellationToken cancellationToken)
    {
        var userId = User.GetRequiredUserId();
        var providerProfileId = await _dbContext.ProviderProfiles
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .Select(x => x.Id)
            .SingleOrDefaultAsync(cancellationToken);

        if (providerProfileId == Guid.Empty)
        {
            return Ok(Array.Empty<ResourceResponse>());
        }

        var resources = await _dbContext.Resources
            .AsNoTracking()
            .Include(x => x.ProviderProfile)
            .Include(x => x.AvailabilityRules)
            .Where(x => x.ProviderProfileId == providerProfileId)
            .OrderBy(x => x.Name)
            .ToListAsync(cancellationToken);

        return Ok(resources.Select(ToResourceResponse).ToList());
    }

    [Authorize]
    [HttpPost("api/provider/resources")]
    public async Task<ActionResult<ResourceResponse>> CreateProviderResource(
        CreateProviderResourceRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || request.Capacity < 1 || request.SlotSizeMinutes < 1)
        {
            return BadRequest(new { message = "Name, capacity and slot size are required." });
        }

        var providerProfile = await _dbContext.ProviderProfiles
            .SingleOrDefaultAsync(x => x.UserId == User.GetRequiredUserId(), cancellationToken);

        if (providerProfile is null)
        {
            return BadRequest(new { message = "Create your provider profile first." });
        }

        var resource = new Resource
        {
            ProviderProfileId = providerProfile.Id,
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
            ApprovalStatus = ModerationStatus.PendingApproval,
            IsActive = true
        };

        _dbContext.Resources.Add(resource);
        await _dbContext.SaveChangesAsync(cancellationToken);

        resource.ProviderProfile = providerProfile;

        return Created($"/api/resources/{resource.Id}", ToResourceResponse(resource));
    }

    [Authorize]
    [HttpPut("api/provider/resources/{resourceId:guid}")]
    public async Task<ActionResult<ResourceResponse>> UpdateProviderResource(
        Guid resourceId,
        CreateProviderResourceRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetRequiredUserId();
        var resource = await _dbContext.Resources
            .Include(x => x.ProviderProfile)
            .Include(x => x.AvailabilityRules)
            .SingleOrDefaultAsync(
                x => x.Id == resourceId &&
                     x.ProviderProfileId != null &&
                     x.ProviderProfile != null &&
                     x.ProviderProfile.UserId == userId,
                cancellationToken);

        if (resource is null)
        {
            return NotFound();
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
        resource.ApprovalStatus = ModerationStatus.PendingApproval;
        resource.ModerationNote = null;
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
