using BookingFlow.Domain.Entity;
using Microsoft.EntityFrameworkCore;

namespace BookingFlow.Api.Data;

public sealed class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<OrganizationMembership> OrganizationMemberships => Set<OrganizationMembership>();
    public DbSet<OrganizationSubscription> OrganizationSubscriptions => Set<OrganizationSubscription>();
    public DbSet<ProviderProfile> ProviderProfiles => Set<ProviderProfile>();
    public DbSet<ProviderOrganizationAffiliation> ProviderOrganizationAffiliations => Set<ProviderOrganizationAffiliation>();
    public DbSet<ProviderOrganizationJoinRequest> ProviderOrganizationJoinRequests => Set<ProviderOrganizationJoinRequest>();
    public DbSet<Resource> Resources => Set<Resource>();
    public DbSet<AvailabilityRule> AvailabilityRules => Set<AvailabilityRule>();
    public DbSet<EventSession> EventSessions => Set<EventSession>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<AnalyticsEvent> AnalyticsEvents => Set<AnalyticsEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(x => x.KeycloakSubject).IsUnique();
            entity.HasIndex(x => x.Email).IsUnique();
            entity.Property(x => x.KeycloakSubject).HasMaxLength(100);
            entity.Property(x => x.Email).HasMaxLength(256);
            entity.Property(x => x.FirstName).HasMaxLength(100);
            entity.Property(x => x.LastName).HasMaxLength(100);
            entity.Property(x => x.Phone).HasMaxLength(50);
            entity.Property(x => x.AvatarImageUrl).HasMaxLength(2048);
            entity.Property(x => x.PreferredLocale).HasMaxLength(10);
        });

        modelBuilder.Entity<OrganizationMembership>(entity =>
        {
            entity.HasIndex(x => new { x.UserId, x.OrganizationId }).IsUnique();
            entity.Property(x => x.Title).HasMaxLength(100);

            entity.HasOne(x => x.User)
                .WithMany(x => x.OrganizationMemberships)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Organization)
                .WithMany(x => x.Memberships)
                .HasForeignKey(x => x.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OrganizationSubscription>(entity =>
        {
            entity.HasIndex(x => x.OrganizationId).IsUnique();
            entity.Property(x => x.MonthlyPrice).HasColumnType("decimal(18,2)");
            entity.Property(x => x.Currency).HasMaxLength(10);

            entity.HasOne(x => x.Organization)
                .WithMany(x => x.Subscriptions)
                .HasForeignKey(x => x.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProviderProfile>(entity =>
        {
            entity.HasIndex(x => x.UserId).IsUnique();
            entity.Property(x => x.DisplayName).HasMaxLength(200);
            entity.Property(x => x.Headline).HasMaxLength(300);
            entity.Property(x => x.City).HasMaxLength(120);
            entity.Property(x => x.TimeZone).HasMaxLength(100);
            entity.Property(x => x.Location).HasMaxLength(300);
            entity.Property(x => x.AvatarImageUrl).HasMaxLength(2048);
            entity.Property(x => x.CoverImageUrl).HasMaxLength(2048);
            entity.Property(x => x.ModerationNote).HasMaxLength(1000);

            entity.HasOne(x => x.User)
                .WithOne(x => x.ProviderProfile)
                .HasForeignKey<ProviderProfile>(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProviderOrganizationAffiliation>(entity =>
        {
            entity.HasIndex(x => new { x.ProviderProfileId, x.OrganizationId }).IsUnique();
            entity.Property(x => x.Title).HasMaxLength(100);

            entity.HasOne(x => x.ProviderProfile)
                .WithMany(x => x.Affiliations)
                .HasForeignKey(x => x.ProviderProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Organization)
                .WithMany(x => x.ProviderAffiliations)
                .HasForeignKey(x => x.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProviderOrganizationJoinRequest>(entity =>
        {
            entity.HasIndex(x => new { x.ProviderProfileId, x.OrganizationId, x.Status });
            entity.Property(x => x.Message).HasMaxLength(1000);
            entity.Property(x => x.ReviewNote).HasMaxLength(1000);

            entity.HasOne(x => x.ProviderProfile)
                .WithMany(x => x.OrganizationJoinRequests)
                .HasForeignKey(x => x.ProviderProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.Organization)
                .WithMany(x => x.ProviderJoinRequests)
                .HasForeignKey(x => x.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.ReviewedByUser)
                .WithMany()
                .HasForeignKey(x => x.ReviewedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Organization>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(200);
            entity.Property(x => x.Description).HasMaxLength(2000);
            entity.Property(x => x.TimeZone).HasMaxLength(100);
            entity.Property(x => x.Address).HasMaxLength(500);
            entity.Property(x => x.City).HasMaxLength(120);
            entity.Property(x => x.Phone).HasMaxLength(50);
            entity.Property(x => x.Email).HasMaxLength(256);
            entity.Property(x => x.WebsiteUrl).HasMaxLength(1024);
            entity.Property(x => x.LogoImageUrl).HasMaxLength(2048);
            entity.Property(x => x.CoverImageUrl).HasMaxLength(2048);
        });

        modelBuilder.Entity<Resource>(entity =>
        {
            entity.HasIndex(x => new { x.OrganizationId, x.Name });
            entity.HasIndex(x => new { x.ProviderProfileId, x.Name });
            entity.Property(x => x.Name).HasMaxLength(200);
            entity.Property(x => x.Description).HasMaxLength(2000);
            entity.Property(x => x.Location).HasMaxLength(300);
            entity.Property(x => x.AvatarImageUrl).HasMaxLength(2048);
            entity.Property(x => x.CoverImageUrl).HasMaxLength(2048);
            entity.Property(x => x.PriceFrom).HasColumnType("decimal(18,2)");
            entity.Property(x => x.ModerationNote).HasMaxLength(1000);

            entity.HasOne(x => x.Organization)
                .WithMany(x => x.Resources)
                .HasForeignKey(x => x.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.ProviderProfile)
                .WithMany(x => x.Resources)
                .HasForeignKey(x => x.ProviderProfileId)
                .OnDelete(DeleteBehavior.Restrict);
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
            entity.Property(x => x.PosterImageUrl).HasMaxLength(2048);
        });

        modelBuilder.Entity<Booking>(entity =>
        {
            entity.HasIndex(x => new { x.UserId, x.StartAtUtc });
            entity.HasIndex(x => new { x.ResourceId, x.StartAtUtc, x.EndAtUtc });
            entity.HasIndex(x => new { x.EventSessionId, x.Status });
            entity.Property(x => x.Price).HasColumnType("decimal(18,2)");
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

            entity.HasOne(x => x.ProviderProfile)
                .WithMany(x => x.Bookings)
                .HasForeignKey(x => x.ProviderProfileId)
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

        modelBuilder.Entity<AnalyticsEvent>(entity =>
        {
            entity.HasIndex(x => new { x.OrganizationId, x.OccurredAtUtc });
            entity.HasIndex(x => new { x.ResourceId, x.OccurredAtUtc });
            entity.HasIndex(x => new { x.EventSessionId, x.OccurredAtUtc });
            entity.HasIndex(x => new { x.EntityType, x.OccurredAtUtc });
            entity.Property(x => x.VisitorId).HasMaxLength(120);
            entity.Property(x => x.Path).HasMaxLength(2048);
            entity.Property(x => x.Referrer).HasMaxLength(2048);
            entity.Property(x => x.UserAgent).HasMaxLength(2048);

            entity.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Organization)
                .WithMany()
                .HasForeignKey(x => x.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.Resource)
                .WithMany()
                .HasForeignKey(x => x.ResourceId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.EventSession)
                .WithMany()
                .HasForeignKey(x => x.EventSessionId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
