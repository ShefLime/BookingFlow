using BookingFlow.Api.Data;
using BookingFlow.Domain.Entity;
using BookingFlow.Domain.Enum;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BookingFlow.Api.Services;

public sealed class DatabaseSeeder(ApplicationDbContext dbContext, IPasswordHasher<User> passwordHasher)
{
    private readonly ApplicationDbContext _dbContext = dbContext;
    private readonly IPasswordHasher<User> _passwordHasher = passwordHasher;

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        await EnsureUserAsync(
            "admin@bookingflow.local",
            "Admin123!",
            "System",
            "Admin",
            "+10000000001",
            UserRole.Admin,
            cancellationToken);

        await EnsureUserAsync(
            "client@bookingflow.local",
            "Client123!",
            "Demo",
            "Client",
            "+10000000002",
            UserRole.Client,
            cancellationToken);

        if (await _dbContext.Organizations.AnyAsync(cancellationToken))
        {
            return;
        }

        var bar = new Organization
        {
            Name = "Harbor Bar",
            Type = OrganizationType.Bar,
            Description = "Bar with table reservations and regular live music events.",
            TimeZone = "Asia/Ho_Chi_Minh",
            Address = "12 Riverside Avenue",
            IsActive = true
        };

        var fitnessClub = new Organization
        {
            Name = "Pulse Fitness Club",
            Type = OrganizationType.FitnessClub,
            Description = "Fitness club with trainer schedules and personal sessions.",
            TimeZone = "Asia/Ho_Chi_Minh",
            Address = "88 Wellness Street",
            IsActive = true
        };

        var tableOne = new Resource
        {
            Organization = bar,
            Name = "Table 1",
            Type = ResourceType.Table,
            Description = "Window table for up to 4 guests.",
            Capacity = 4,
            SlotSizeMinutes = 120,
            IsActive = true
        };

        var tableTwo = new Resource
        {
            Organization = bar,
            Name = "VIP Table",
            Type = ResourceType.VipTable,
            Description = "VIP table for up to 6 guests.",
            Capacity = 6,
            SlotSizeMinutes = 120,
            IsActive = true
        };

        var trainer = new Resource
        {
            Organization = fitnessClub,
            Name = "Anna Petrova",
            Type = ResourceType.Trainer,
            Description = "Personal trainer available for 1:1 sessions.",
            Capacity = 1,
            SlotSizeMinutes = 60,
            IsActive = true
        };

        AddDailyRules(tableOne, TimeSpan.FromHours(17), TimeSpan.FromHours(23));
        AddDailyRules(tableTwo, TimeSpan.FromHours(17), TimeSpan.FromHours(23));
        AddWeekdayRules(trainer, TimeSpan.FromHours(9), TimeSpan.FromHours(18));

        var jazzNight = new EventSession
        {
            Organization = bar,
            Name = "Friday Jazz Night",
            Description = "Live jazz evening with a welcome drink included.",
            Location = "Main Hall",
            StartAtUtc = NextOccurrenceUtc(DayOfWeek.Friday, 13),
            EndAtUtc = NextOccurrenceUtc(DayOfWeek.Friday, 16),
            Capacity = 40,
            IsActive = true
        };

        var boxingWorkshop = new EventSession
        {
            Organization = fitnessClub,
            Name = "Boxing Fundamentals Workshop",
            Description = "Introductory class for beginners with equipment included.",
            Location = "Studio A",
            StartAtUtc = NextOccurrenceUtc(DayOfWeek.Saturday, 3),
            EndAtUtc = NextOccurrenceUtc(DayOfWeek.Saturday, 5),
            Capacity = 18,
            IsActive = true
        };

        _dbContext.Organizations.AddRange(bar, fitnessClub);
        _dbContext.Resources.AddRange(tableOne, tableTwo, trainer);
        _dbContext.EventSessions.AddRange(jazzNight, boxingWorkshop);

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsureUserAsync(
        string email,
        string password,
        string firstName,
        string lastName,
        string phone,
        UserRole role,
        CancellationToken cancellationToken)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var existingUser = await _dbContext.Users.SingleOrDefaultAsync(x => x.Email == normalizedEmail, cancellationToken);

        if (existingUser is not null)
        {
            if (existingUser.Role != role)
            {
                existingUser.Role = role;
                existingUser.UpdatedAtUtc = DateTimeOffset.UtcNow;
                await _dbContext.SaveChangesAsync(cancellationToken);
            }

            return;
        }

        var user = new User
        {
            Email = normalizedEmail,
            FirstName = firstName,
            LastName = lastName,
            Phone = phone,
            Role = role,
            IsActive = true
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, password);
        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private static void AddDailyRules(Resource resource, TimeSpan startTime, TimeSpan endTime)
    {
        foreach (DayOfWeek dayOfWeek in Enum.GetValues(typeof(DayOfWeek)))
        {
            resource.AvailabilityRules.Add(new AvailabilityRule
            {
                Resource = resource,
                DayOfWeek = dayOfWeek,
                StartTime = startTime,
                EndTime = endTime,
                IsActive = true
            });
        }
    }

    private static void AddWeekdayRules(Resource resource, TimeSpan startTime, TimeSpan endTime)
    {
        var weekdays = new[]
        {
            DayOfWeek.Monday,
            DayOfWeek.Tuesday,
            DayOfWeek.Wednesday,
            DayOfWeek.Thursday,
            DayOfWeek.Friday
        };

        foreach (var dayOfWeek in weekdays)
        {
            resource.AvailabilityRules.Add(new AvailabilityRule
            {
                Resource = resource,
                DayOfWeek = dayOfWeek,
                StartTime = startTime,
                EndTime = endTime,
                IsActive = true
            });
        }
    }

    private static DateTimeOffset NextOccurrenceUtc(DayOfWeek targetDay, int hourUtc)
    {
        var now = DateTimeOffset.UtcNow;
        var date = now.Date;

        while (date.DayOfWeek != targetDay || date <= now.Date)
        {
            date = date.AddDays(1);
        }

        return new DateTimeOffset(date.Year, date.Month, date.Day, hourUtc, 0, 0, TimeSpan.Zero);
    }
}
