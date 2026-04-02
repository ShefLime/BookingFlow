FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["BookingFlow.Api/BookingFlow.Api.csproj", "BookingFlow.Api/"]
COPY ["BookingFlow.Domain/BookingFlow.Domain.csproj", "BookingFlow.Domain/"]
RUN dotnet restore "BookingFlow.Api/BookingFlow.Api.csproj"

COPY . .
WORKDIR /src/BookingFlow.Api
RUN dotnet publish "BookingFlow.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "BookingFlow.Api.dll"]
