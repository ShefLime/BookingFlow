namespace BookingFlow.App.Feature;

public sealed record CreateBookingCommand(
    Guid UserId,
    Guid OrganizationId,
    Guid ResourceId,
    DateTimeOffset StartAtUtc,
    DateTimeOffset EndAtUtc,
    string? Comment);

public sealed record CancelBookingCommand(
    Guid BookingId,
    Guid UserId,
    string? Reason);

public sealed record RescheduleBookingCommand(
    Guid BookingId,
    Guid UserId,
    DateTimeOffset NewStartAtUtc,
    DateTimeOffset NewEndAtUtc);

public sealed record GetBookingByIdQuery(Guid BookingId, Guid UserId);

public sealed record GetMyBookingsQuery(
    Guid UserId,
    int Page = 1,
    int PageSize = 20);