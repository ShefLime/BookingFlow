# Шаг 0. Preflight и feature matrix

Текущий vertical slice для шага 1:

- публичный locale-aware shell c загрузкой организаций;
- auth bootstrap через Keycloak + `GET /api/auth/me` для будущего кабинета.

## Flow matrix

### 1. Public bootstrap

- Endpoint: `GET /api/organizations?includeInactive=false`
- Request: query `type?`, `includeInactive?`
- Response: `OrganizationResponse[]`
- Auth: не требуется
- Role: public
- I18n поля:
  - `content.heroTitle`
  - `content.heroSubtitle`
  - `content.summary`
  - `content.description`
  - `content.atmosphere`
  - `content.amenities`
  - `content.serviceHighlights`
- Timezone:
  - у организации есть `timeZone`
  - даты API в этом flow не приходят, но timezone нужно показывать и использовать как owner timezone на UI
- Media upload: не нужен
- Screen: public

### 2. Auth bootstrap

- Endpoint: `GET /api/auth/me`
- Request: Bearer token от Keycloak
- Response: `CurrentUserResponse`
- Auth: обязателен
- Role: любой аутентифицированный пользователь, роли приходят в response
- I18n поля: нет
- Timezone:
  - timezone в ответе нет
  - использовать только как bootstrap профиля и ролей
- Media upload: не нужен
- Screen: private shell bootstrap

## Проверенные ограничения

- Основной browser auth-flow должен идти через Keycloak OIDC, не через кастомный login form.
- Для шага 1 реальный публичный экран есть, а кабинет можно поднять как shell без CRUD.
- Локализованный контент уже есть в `OrganizationContent` и должен резолвиться с fallback `current -> en -> ru -> vi -> first non-empty`.
- Для шага 1 достаточно public + private shell, upload и booking-flow пока не нужны.
