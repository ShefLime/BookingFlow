using BookingFlow.Domain.Entity;
using Microsoft.EntityFrameworkCore;

namespace BookingFlow.Api.Data;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<Resource> Resources => Set<Resource>();
    public DbSet<AvailabilityRule> AvailabilityRules => Set<AvailabilityRule>();
    public DbSet<EventSession> EventSessions => Set<EventSession>();
    public DbSet<Booking> Bookings => Set<Booking>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(x => x.Email).IsUnique();
            entity.Property(x => x.Email).HasMaxLength(256);
            entity.Property(x => x.PasswordHash).HasMaxLength(1024);
            entity.Property(x => x.FirstName).HasMaxLength(100);
            entity.Property(x => x.LastName).HasMaxLength(100);
            entity.Property(x => x.Phone).HasMaxLength(50);
        });

        modelBuilder.Entity<Organization>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(200);
            entity.Property(x => x.Description).HasMaxLength(2000);
            entity.Property(x => x.TimeZone).HasMaxLength(100);
            entity.Property(x => x.Address).HasMaxLength(500);
        });

        modelBuilder.Entity<Resource>(entity =>
        {
            entity.HasIndex(x => new { x.OrganizationId, x.Name });
            entity.Property(x => x.Name).HasMaxLength(200);
            entity.Property(x => x.Description).HasMaxLength(2000);
        });

        modelBuilder.Entity<AvailabilityRule>(entity =>
        {
            entity.HasIndex(x => new { x.ResourceId, x.DayOfWeek, x.StartTime, x.EndTime });
        });

        modelBuilder.Entity<EventSession>(entity =>
        {
            entity.HasIndex(x => new { x.OrganizationId, x.StartAtUtc });
            entity.Property(x => x.Name).HasMaxLength(200);
            entity.Property(x => x.Description).HasMaxLength(2000);
            entity.Property(x => x.Location).HasMaxLength(300);
        });

        modelBuilder.Entity<Booking>(entity =>
        {
            entity.HasIndex(x => new { x.UserId, x.StartAtUtc });
            entity.HasIndex(x => new { x.ResourceId, x.StartAtUtc, x.EndAtUtc });
            entity.HasIndex(x => new { x.EventSessionId, x.Status });
            entity.Property(x => x.Comment).HasMaxLength(2000);
            entity.Property(x => x.CancellationReason).HasMaxLength(1000);
            entity.Property(x => x.Currency).HasMaxLength(10);

            entity.HasOne(x => x.User)
                .WithMany(x => x.Bookings)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Organization)
                .WithMany(x => x.Bookings)
                .HasForeignKey(x => x.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Resource)
                .WithMany(x => x.Bookings)
                .HasForeignKey(x => x.ResourceId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.EventSession)
                .WithMany(x => x.Bookings)
                .HasForeignKey(x => x.EventSessionId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
