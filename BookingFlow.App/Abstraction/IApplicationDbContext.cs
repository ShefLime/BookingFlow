using BookingFlow.Domain.Entity;
using Microsoft.EntityFrameworkCore;

namespace BookingFlow.App.Abstraction;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<Organization> Organizations { get; }
    DbSet<Resource> Resources { get; }
    DbSet<Booking> Bookings { get; }
    DbSet<AvailabilityRule> AvailabilityRules { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}