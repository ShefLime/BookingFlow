#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
docker compose up --build -d

printf "\nBookingFlow is up.\n"
printf "Frontend: http://localhost:5173\n"
printf "Swagger:  http://localhost:5282/swagger\n\n"
printf "Keycloak: http://localhost:8081\n"
printf "Admin UI: http://localhost:8081/admin\n\n"
