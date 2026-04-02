namespace BookingFlow.Api.Options;

public sealed class StorageOptions
{
    public const string SectionName = "Storage";

    public string Provider { get; set; } = "Minio";
    public string ServiceUrl { get; set; } = "http://localhost:9000";
    public string Region { get; set; } = "us-east-1";
    public string AccessKey { get; set; } = "bookingflow";
    public string SecretKey { get; set; } = "bookingflow-secret";
    public string BucketName { get; set; } = "bookingflow-media";
    public string PublicBaseUrl { get; set; } = "http://localhost:9000/bookingflow-media";
    public bool ForcePathStyle { get; set; } = true;
}
