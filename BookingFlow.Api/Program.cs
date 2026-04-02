using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;
using Amazon.Runtime;
using Amazon.S3;
using BookingFlow.Api.Data;
using BookingFlow.Api.Extensions;
using BookingFlow.Api.Options;
using BookingFlow.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<KeycloakOptions>(builder.Configuration.GetSection(KeycloakOptions.SectionName));
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
builder.Services.Configure<StorageOptions>(builder.Configuration.GetSection(StorageOptions.SectionName));
builder.Services.AddDbContext<ApplicationDbContext>((serviceProvider, options) =>
{
    var configuration = serviceProvider.GetRequiredService<IConfiguration>();
    var connectionString = configuration.GetConnectionString("DefaultConnection")
                          ?? throw new InvalidOperationException("Database connection string is missing.");
    var provider = configuration["Database:Provider"];

    if (string.Equals(provider, "Sqlite", StringComparison.OrdinalIgnoreCase) ||
        connectionString.Contains("Data Source=", StringComparison.OrdinalIgnoreCase))
    {
        options.UseSqlite(connectionString);
        return;
    }

    options.UseNpgsql(connectionString);
});

builder.Services.AddSingleton<IAmazonS3>(serviceProvider =>
{
    var storageOptions = serviceProvider.GetRequiredService<IOptions<StorageOptions>>().Value;
    var config = new AmazonS3Config
    {
        ServiceURL = storageOptions.ServiceUrl,
        ForcePathStyle = storageOptions.ForcePathStyle,
        AuthenticationRegion = storageOptions.Region,
        UseHttp = storageOptions.ServiceUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
    };

    return new AmazonS3Client(
        new BasicAWSCredentials(storageOptions.AccessKey, storageOptions.SecretKey),
        config);
});

builder.Services.AddScoped<AvailabilityService>();
builder.Services.AddScoped<DatabaseSeeder>();
builder.Services.AddScoped<MediaStorageService>();
builder.Services.AddScoped<UserProvisioningService>();
builder.Services.AddScoped<AccessControlService>();
builder.Services.AddScoped<OrganizationAnalyticsService>();
builder.Services.AddHttpContextAccessor();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "BookingFlow API",
        Version = "v1",
        Description = "Backend for clubs, bars, trainers and event bookings."
    });

    options.CustomSchemaIds(type => type.FullName?.Replace("+", ".") ?? type.Name);

    var securityScheme = new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Paste only the JWT token."
    };

    options.AddSecurityDefinition("Bearer", securityScheme);
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => ConfigureAuthentication(options, builder.Configuration, builder.Environment));

builder.Services.AddAuthorization();

var app = builder.Build();

await InitializeDatabaseAsync(app.Services, app.Logger);

app.UseSwagger();
app.UseSwaggerUI();

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/", () => Results.Redirect("/swagger/index.html")).ExcludeFromDescription();
app.MapControllers();

app.Run();

static void ConfigureAuthentication(
    JwtBearerOptions options,
    IConfiguration configuration,
    IWebHostEnvironment environment)
{
    if (environment.IsEnvironment("Testing"))
    {
        var jwtOptions = configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
                         ?? throw new InvalidOperationException("JWT configuration is missing.");

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey)),
            RoleClaimType = ClaimTypes.Role,
            ClockSkew = TimeSpan.Zero
        };
    }
    else
    {
        var keycloakOptions = configuration.GetSection(KeycloakOptions.SectionName).Get<KeycloakOptions>()
                              ?? throw new InvalidOperationException("Keycloak configuration is missing.");

        var authority = keycloakOptions.Authority.TrimEnd('/');
        options.Authority = authority;
        options.MetadataAddress = string.IsNullOrWhiteSpace(keycloakOptions.MetadataAddress)
            ? $"{authority}/.well-known/openid-configuration"
            : keycloakOptions.MetadataAddress;
        options.RequireHttpsMetadata = keycloakOptions.RequireHttpsMetadata;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = authority,
            ValidateAudience = false,
            ValidateLifetime = true,
            RoleClaimType = ClaimTypes.Role,
            ClockSkew = TimeSpan.Zero
        };
    }

    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = async context =>
        {
            var provisioningService = context.HttpContext.RequestServices.GetRequiredService<UserProvisioningService>();
            var user = await provisioningService.SyncAuthenticatedUserAsync(context.Principal!, context.HttpContext.RequestAborted);
            var roles = provisioningService.GetEffectiveRoles(user);

            if (context.Principal?.Identity is not ClaimsIdentity identity)
            {
                return;
            }

            if (!identity.HasClaim(x => x.Type == ClaimsPrincipalExtensions.BookingFlowUserIdClaim))
            {
                identity.AddClaim(new Claim(ClaimsPrincipalExtensions.BookingFlowUserIdClaim, user.Id.ToString()));
            }

            foreach (var role in roles)
            {
                if (!identity.HasClaim(identity.RoleClaimType, role.ToString()))
                {
                    identity.AddClaim(new Claim(identity.RoleClaimType, role.ToString()));
                }
            }
        }
    };
}

static async Task InitializeDatabaseAsync(IServiceProvider services, ILogger logger)
{
    const int maxAttempts = 10;

    for (var attempt = 1; attempt <= maxAttempts; attempt++)
    {
        try
        {
            using var scope = services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            await dbContext.Database.EnsureCreatedAsync();

            var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
            await seeder.SeedAsync();
            return;
        }
        catch (Exception exception) when (attempt < maxAttempts)
        {
            logger.LogWarning(
                exception,
                "Database initialization attempt {Attempt} of {MaxAttempts} failed. Retrying...",
                attempt,
                maxAttempts);

            await Task.Delay(TimeSpan.FromSeconds(Math.Min(attempt * 2, 10)));
        }
    }
}

public partial class Program;
