namespace BookingFlow.Api.Services;

public static class BookingFlowClock
{
    private const string OverrideVariable = "BOOKINGFLOW_OVERRIDE_UTC_NOW";

    public static DateTimeOffset UtcNow
    {
        get
        {
            var overrideValue = Environment.GetEnvironmentVariable(OverrideVariable);
            if (DateTimeOffset.TryParse(overrideValue, out var overriddenNow))
            {
                return overriddenNow.ToUniversalTime();
            }

            return DateTimeOffset.UtcNow;
        }
    }
}
