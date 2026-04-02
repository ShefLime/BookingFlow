using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using BookingFlow.Api.Options;
using Microsoft.Extensions.Options;

namespace BookingFlow.Api.Services;

public sealed class MediaStorageService(IAmazonS3 s3Client, IOptions<StorageOptions> storageOptions)
{
    private readonly IAmazonS3 _s3Client = s3Client;
    private readonly StorageOptions _storageOptions = storageOptions.Value;

    public async Task<StoredMediaResult> UploadAsync(
        IFormFile file,
        string? folder,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(file);

        var originalFileName = Path.GetFileName(file.FileName);
        var extension = Path.GetExtension(originalFileName);
        var normalizedFolder = string.IsNullOrWhiteSpace(folder) ? "uploads" : SanitizePathSegment(folder);
        var objectKey = $"{normalizedFolder}/{DateTimeOffset.UtcNow:yyyy/MM}/{Guid.NewGuid():N}{extension}";

        await using var stream = file.OpenReadStream();
        var request = new PutObjectRequest
        {
            BucketName = _storageOptions.BucketName,
            Key = objectKey,
            InputStream = stream,
            AutoCloseStream = false,
            ContentType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType
        };

        await _s3Client.PutObjectAsync(request, cancellationToken);

        return new StoredMediaResult
        {
            Url = BuildPublicUrl(objectKey),
            ObjectKey = objectKey,
            FileName = originalFileName,
            ContentType = request.ContentType,
            SizeBytes = file.Length,
            StorageProvider = _storageOptions.Provider
        };
    }

    private string BuildPublicUrl(string objectKey)
    {
        var encodedPath = string.Join(
            "/",
            objectKey.Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(Uri.EscapeDataString));

        return $"{_storageOptions.PublicBaseUrl.TrimEnd('/')}/{encodedPath}";
    }

    private static string SanitizePathSegment(string value)
    {
        var safeValue = new string(value
            .Trim()
            .ToLowerInvariant()
            .Select(character => char.IsLetterOrDigit(character) || character is '-' or '_' ? character : '-')
            .ToArray());

        return string.IsNullOrWhiteSpace(safeValue) ? "uploads" : safeValue;
    }
}

public sealed class StoredMediaResult
{
    public string Url { get; set; } = null!;
    public string ObjectKey { get; set; } = null!;
    public string FileName { get; set; } = null!;
    public string ContentType { get; set; } = null!;
    public long SizeBytes { get; set; }
    public string StorageProvider { get; set; } = null!;
}
