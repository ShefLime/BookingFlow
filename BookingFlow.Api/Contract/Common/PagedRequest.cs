namespace BookingFlow.Api.Contract.Common
{
    public sealed class PagedRequest
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }
}