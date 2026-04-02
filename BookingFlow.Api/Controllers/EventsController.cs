using BookingFlow.Api.Contract.Event;
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
public sealed class EventsController(
    ApplicationDbContext dbContext,
    AccessControlService accessControlService) : ControllerBase
{
    private readonly ApplicationDbContext _dbContext = dbContext;
    private readonly AccessControlService _accessControlService = accessControlService;

    [HttpGet("api/organizations/{organizationId:guid}/events")]
    public async Task<ActionResult<IReadOnlyCollection<EventResponse>>> GetEvents(
        Guid organizationId,
        [FromQuery] DateTimeOffset? fromUtc,
        [FromQuery] bool includeInactive,
        CancellationToken cancellationToken)
    {
        var organizationExists = await _dbContext.Organizations.AsNoTracking().AnyAsync(x => x.Id == organizationId, cancellationToken);
        if (!organizationExists)
        {
            return NotFound();
        }

        var query = _dbContext.EventSessions
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId)
            .AsQueryable();

        if (!includeInactive)
        {
            query = query.Where(x => x.IsActive);
        }

        var events = await query
            .Select(x => new EventResponse
            {
                Id = x.Id,
                OrganizationId = x.OrganizationId,
                OrganizationName = x.Organization.Name,
                Name = x.Name,
                Description = x.Description,
                Location = x.Location,
                PosterImageUrl = x.PosterImageUrl,
                Gallery = StructuredContentSerializer.DeserializeOrDefault<List<MediaAssetItem>>(x.GalleryJson),
                Documents = StructuredContentSerializer.DeserializeOrDefault<List<MediaAssetItem>>(x.DocumentsJson),
                Content = StructuredContentSerializer.DeserializeOrDefault<EventContent>(x.ContentJson),
                StartAtUtc = x.StartAtUtc,
                EndAtUtc = x.EndAtUtc,
                Capacity = x.Capacity,
                RemainingCapacity = x.Capacity - (x.Bookings
                    .Where(y => y.Status != BookingStatus.Cancelled && y.Status != BookingStatus.Expired)
                    .Sum(y => (int?)y.GuestCount) ?? 0),
                IsActive = x.IsActive
            })
            .ToListAsync(cancellationToken);

        if (fromUtc.HasValue)
        {
            var fromUtcValue = fromUtc.Value.ToUniversalTime();
            events = events.Where(x => x.StartAtUtc >= fromUtcValue).ToList();
        }

        events = events.OrderBy(x => x.StartAtUtc).ToList();

        return Ok(events);
    }

    [HttpGet("api/events/{eventId:guid}")]
    public async Task<ActionResult<EventResponse>> GetEventById(Guid eventId, CancellationToken cancellationToken)
    {
        var eventSession = await _dbContext.EventSessions
            .AsNoTracking()
            .Where(x => x.Id == eventId)
            .Select(x => new EventResponse
            {
                Id = x.Id,
                OrganizationId = x.OrganizationId,
                OrganizationName = x.Organization.Name,
                Name = x.Name,
                Description = x.Description,
                Location = x.Location,
                PosterImageUrl = x.PosterImageUrl,
                Gallery = StructuredContentSerializer.DeserializeOrDefault<List<MediaAssetItem>>(x.GalleryJson),
                Documents = StructuredContentSerializer.DeserializeOrDefault<List<MediaAssetItem>>(x.DocumentsJson),
                Content = StructuredContentSerializer.DeserializeOrDefault<EventContent>(x.ContentJson),
                StartAtUtc = x.StartAtUtc,
                EndAtUtc = x.EndAtUtc,
                Capacity = x.Capacity,
                RemainingCapacity = x.Capacity - (x.Bookings
                    .Where(y => y.Status != BookingStatus.Cancelled && y.Status != BookingStatus.Expired)
                    .Sum(y => (int?)y.GuestCount) ?? 0),
                IsActive = x.IsActive
            })
            .SingleOrDefaultAsync(cancellationToken);

        return eventSession is null ? NotFound() : Ok(eventSession);
    }

    [Authorize(Roles = AuthorizationRoles.AdminOrManager)]
    [HttpPost("api/organizations/{organizationId:guid}/events")]
    public async Task<ActionResult<EventResponse>> CreateEvent(
        Guid organizationId,
        CreateEventRequest request,
        CancellationToken cancellationToken)
    {
        if (organizationId != request.OrganizationId)
        {
            return BadRequest(new { message = "Organization id in route and body must match." });
        }

        if (!IsValidEventRequest(request.Name, request.Description, request.Location, request.StartAtUtc, request.EndAtUtc, request.Capacity))
        {
            return BadRequest(new { message = "Invalid event payload." });
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

        var eventSession = new EventSession
        {
            OrganizationId = organizationId,
            Name = request.Name.Trim(),
            Description = request.Description.Trim(),
            Location = request.Location.Trim(),
            PosterImageUrl = request.PosterImageUrl?.Trim(),
            GalleryJson = StructuredContentSerializer.Serialize(request.Gallery),
            DocumentsJson = StructuredContentSerializer.Serialize(request.Documents),
            ContentJson = StructuredContentSerializer.Serialize(request.Content),
            StartAtUtc = request.StartAtUtc.ToUniversalTime(),
            EndAtUtc = request.EndAtUtc.ToUniversalTime(),
            Capacity = request.Capacity,
            IsActive = true
        };

        _dbContext.EventSessions.Add(eventSession);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(
            nameof(GetEventById),
            new { eventId = eventSession.Id },
            ToResponse(eventSession, organization.Name));
    }

    [Authorize(Roles = AuthorizationRoles.AdminOrManager)]
    [HttpPut("api/events/{eventId:guid}")]
    public async Task<ActionResult<EventResponse>> UpdateEvent(
        Guid eventId,
        UpdateEventRequest request,
        CancellationToken cancellationToken)
    {
        if (!IsValidEventRequest(request.Name, request.Description, request.Location, request.StartAtUtc, request.EndAtUtc, request.Capacity))
        {
            return BadRequest(new { message = "Invalid event payload." });
        }

        var eventSession = await _dbContext.EventSessions
            .Include(x => x.Organization)
            .Include(x => x.Bookings)
            .SingleOrDefaultAsync(x => x.Id == eventId, cancellationToken);

        if (eventSession is null)
        {
            return NotFound();
        }

        var canManage = await _accessControlService.CanManageOrganizationAsync(User, eventSession.OrganizationId, cancellationToken);
        if (!canManage)
        {
            return Forbid();
        }

        eventSession.Name = request.Name.Trim();
        eventSession.Description = request.Description.Trim();
        eventSession.Location = request.Location.Trim();
        eventSession.PosterImageUrl = request.PosterImageUrl?.Trim();
        eventSession.GalleryJson = StructuredContentSerializer.Serialize(request.Gallery);
        eventSession.DocumentsJson = StructuredContentSerializer.Serialize(request.Documents);
        eventSession.ContentJson = StructuredContentSerializer.Serialize(request.Content);
        eventSession.StartAtUtc = request.StartAtUtc.ToUniversalTime();
        eventSession.EndAtUtc = request.EndAtUtc.ToUniversalTime();
        eventSession.Capacity = request.Capacity;
        eventSession.IsActive = request.IsActive;
        eventSession.UpdatedAtUtc = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(ToResponse(eventSession, eventSession.Organization.Name));
    }

    private static bool IsValidEventRequest(
        string name,
        string description,
        string location,
        DateTimeOffset startAtUtc,
        DateTimeOffset endAtUtc,
        int capacity)
    {
        return !string.IsNullOrWhiteSpace(name) &&
               !string.IsNullOrWhiteSpace(description) &&
               !string.IsNullOrWhiteSpace(location) &&
               capacity > 0 &&
               startAtUtc < endAtUtc;
    }

    private static EventResponse ToResponse(EventSession eventSession, string organizationName)
    {
        var reservedGuests = eventSession.Bookings
            .Where(x => x.Status != BookingStatus.Cancelled && x.Status != BookingStatus.Expired)
            .Sum(x => x.GuestCount);

        return new EventResponse
        {
            Id = eventSession.Id,
            OrganizationId = eventSession.OrganizationId,
            OrganizationName = organizationName,
            Name = eventSession.Name,
            Description = eventSession.Description,
            Location = eventSession.Location,
            PosterImageUrl = eventSession.PosterImageUrl,
            Gallery = StructuredContentSerializer.DeserializeOrDefault<List<MediaAssetItem>>(eventSession.GalleryJson),
            Documents = StructuredContentSerializer.DeserializeOrDefault<List<MediaAssetItem>>(eventSession.DocumentsJson),
            Content = StructuredContentSerializer.DeserializeOrDefault<EventContent>(eventSession.ContentJson),
            StartAtUtc = eventSession.StartAtUtc,
            EndAtUtc = eventSession.EndAtUtc,
            Capacity = eventSession.Capacity,
            RemainingCapacity = Math.Max(0, eventSession.Capacity - reservedGuests),
            IsActive = eventSession.IsActive
        };
    }
}
