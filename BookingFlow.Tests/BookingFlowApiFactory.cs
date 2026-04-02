using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace BookingFlow.Tests;

internal sealed class BookingFlowApiFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseDirectory = Path.Combine(Path.GetTempPath(), $"bookingflow-tests-{Guid.NewGuid():N}");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        Directory.CreateDirectory(_databaseDirectory);

        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, configBuilder) =>
        {
            var settings = new Dictionary<string, string?>
            {
                ["Database:Provider"] = "Sqlite",
                ["ConnectionStrings:DefaultConnection"] = $"Data Source={Path.Combine(_databaseDirectory, "bookingflow.tests.db")}",
                ["Jwt:Issuer"] = "BookingFlow.Tests",
                ["Jwt:Audience"] = "BookingFlow.Tests.Client",
                ["Jwt:SigningKey"] = "bookingflow-tests-signing-key-please-change",
                ["Jwt:ExpirationMinutes"] = "120"
            };

            configBuilder.AddInMemoryCollection(settings);
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);

        if (!disposing || !Directory.Exists(_databaseDirectory))
        {
            return;
        }

        try
        {
            Directory.Delete(_databaseDirectory, true);
        }
        catch (IOException)
        {
        }
        catch (UnauthorizedAccessException)
        {
        }
    }
}
