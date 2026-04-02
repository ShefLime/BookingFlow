FROM node:24-alpine AS build
WORKDIR /app

COPY ["BookingFlow.Frontend/package.json", "BookingFlow.Frontend/package-lock.json", "./"]
RUN npm ci

COPY BookingFlow.Frontend/ ./
RUN npm run build

FROM nginx:1.29-alpine AS final
COPY BookingFlow.Frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
