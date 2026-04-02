using BookingFlow.Api.Contract.Media;
using BookingFlow.Api.Extensions;
using BookingFlow.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BookingFlow.Api.Controllers;

[ApiController]
[Route("api/media")]
[Authorize(Roles = AuthorizationRoles.AdminOrManager)]
public sealed class MediaController(MediaStorageService mediaStorageService) : ControllerBase
{
    private readonly MediaStorageService _mediaStorageService = mediaStorageService;

    [HttpPost("upload")]
    [RequestSizeLimit(25 * 1024 * 1024)]
    public async Task<ActionResult<UploadedMediaResponse>> Upload(
        IFormFile file,
        [FromForm] string? folder,
        CancellationToken cancellationToken)
    {
        if (file.Length <= 0)
        {
            return BadRequest(new { message = "Uploaded file is empty." });
        }

        var result = await _mediaStorageService.UploadAsync(file, folder, cancellationToken);

        return Ok(new UploadedMediaResponse
        {
            Url = result.Url,
            ObjectKey = result.ObjectKey,
            FileName = result.FileName,
            ContentType = result.ContentType,
            SizeBytes = result.SizeBytes,
            StorageProvider = result.StorageProvider
        });
    }
}
