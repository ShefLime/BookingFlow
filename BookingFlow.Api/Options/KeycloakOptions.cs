namespace BookingFlow.Api.Options;

public sealed class KeycloakOptions
{
    public const string SectionName = "Keycloak";

    public string Realm { get; set; } = "bookingflow";
    public string Authority { get; set; } = "http://localhost:8081/realms/bookingflow";
    public string? MetadataAddress { get; set; }
    public string FrontendClientId { get; set; } = "bookingflow-frontend";
    public bool RequireHttpsMetadata { get; set; }
}
