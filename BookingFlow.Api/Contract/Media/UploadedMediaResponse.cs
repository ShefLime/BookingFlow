namespace BookingFlow.Api.Contract.Media;

public sealed class UploadedMediaResponse
{
    public string Url { get; set; } = null!;
    public string ObjectKey { get; set; } = null!;
    public string FileName { get; set; } = null!;
    public string ContentType { get; set; } = null!;
    public long SizeBytes { get; set; }
    public string StorageProvider { get; set; } = null!;
}
