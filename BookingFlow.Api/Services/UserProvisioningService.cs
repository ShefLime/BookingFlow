using System.Security.Claims;
using System.Text.Json;
using BookingFlow.Api.Data;
using BookingFlow.Domain.Entity;
using BookingFlow.Domain.Enum;
using Microsoft.EntityFrameworkCore;

namespace BookingFlow.Api.Services;

public sealed class UserProvisioningService(ApplicationDbContext dbContext)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly ApplicationDbContext _dbContext = dbContext;

    public async Task<User> SyncAuthenticatedUserAsync(ClaimsPrincipal principal, CancellationToken cancellationToken = default)
    {
        var subject = principal.FindFirstValue("sub") ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(subject))
        {
            throw new UnauthorizedAccessException("Authenticated user subject is missing.");
        }

        var email = principal.FindFirstValue("email")
                    ?? principal.FindFirstValue(ClaimTypes.Email)
                    ?? $"{subject}@bookingflow.local";

        var firstName = principal.FindFirstValue("given_name")
                        ?? principal.FindFirstValue(ClaimTypes.GivenName)
                        ?? "Guest";

        var lastName = principal.FindFirstValue("family_name")
                       ?? principal.FindFirstValue(ClaimTypes.Surname)
                       ?? "User";

        var phone = principal.FindFirstValue("phone_number");
        var preferredLocale = principal.FindFirstValue("locale");

        var user = await _dbContext.Users
            .Include(x => x.OrganizationMemberships.Where(y => y.IsActive))
            .Include(x => x.ProviderProfile)
            .SingleOrDefaultAsync(x => x.KeycloakSubject == subject, cancellationToken);

        if (user is null)
        {
            user = new User
            {
                KeycloakSubject = subject,
                Email = email.Trim(),
                FirstName = firstName.Trim(),
                LastName = lastName.Trim(),
                Phone = phone?.Trim(),
                PreferredLocale = preferredLocale?.Trim(),
                RolesJson = SerializeStoredRoles(Array.Empty<UserRole>())
            };

            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync(cancellationToken);
            return user;
        }

        var hasChanges = false;

        if (!string.Equals(user.Email, email, StringComparison.OrdinalIgnoreCase))
        {
            user.Email = email.Trim();
            hasChanges = true;
        }

        if (!string.Equals(user.FirstName, firstName, StringComparison.Ordinal))
        {
            user.FirstName = firstName.Trim();
            hasChanges = true;
        }

        if (!string.Equals(user.LastName, lastName, StringComparison.Ordinal))
        {
            user.LastName = lastName.Trim();
            hasChanges = true;
        }

        if (!string.Equals(user.Phone, phone, StringComparison.Ordinal))
        {
            user.Phone = phone?.Trim();
            hasChanges = true;
        }

        if (!string.Equals(user.PreferredLocale, preferredLocale, StringComparison.Ordinal))
        {
            user.PreferredLocale = preferredLocale?.Trim();
            hasChanges = true;
        }

        if (hasChanges)
        {
            user.UpdatedAtUtc = DateTimeOffset.UtcNow;
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return user;
    }

    public IReadOnlyCollection<UserRole> GetEffectiveRoles(User user)
    {
        var roles = new HashSet<UserRole>
        {
            UserRole.Client,
            UserRole.Provider
        };

        foreach (var role in ParseStoredRoles(user.RolesJson))
        {
            roles.Add(role);
        }

        if (user.OrganizationMemberships.Any(x => x.IsActive))
        {
            roles.Add(UserRole.Manager);
        }

        return roles.OrderBy(x => x).ToArray();
    }

    public static IReadOnlyCollection<UserRole> ParseStoredRoles(string? rolesJson)
    {
        if (string.IsNullOrWhiteSpace(rolesJson))
        {
            return Array.Empty<UserRole>();
        }

        try
        {
            var roles = JsonSerializer.Deserialize<List<UserRole>>(rolesJson, JsonOptions);
            return roles?.Distinct().ToArray() ?? Array.Empty<UserRole>();
        }
        catch
        {
            return Array.Empty<UserRole>();
        }
    }

    public static string SerializeStoredRoles(IEnumerable<UserRole> roles)
    {
        return JsonSerializer.Serialize(
            roles
                .Distinct()
                .Where(role => role is UserRole.Admin or UserRole.Manager or UserRole.Provider or UserRole.Client)
                .OrderBy(role => role),
            JsonOptions);
    }
}
