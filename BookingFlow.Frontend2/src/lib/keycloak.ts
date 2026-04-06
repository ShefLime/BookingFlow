import Keycloak from 'keycloak-js'

let keycloakClient: Keycloak | null = null

export function hasKeycloakConfig() {
  return Boolean(
    import.meta.env.VITE_KEYCLOAK_URL &&
      import.meta.env.VITE_KEYCLOAK_REALM &&
      import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
  )
}

export function createKeycloakClient() {
  if (!keycloakClient) {
    keycloakClient = new Keycloak({
      url: import.meta.env.VITE_KEYCLOAK_URL,
      realm: import.meta.env.VITE_KEYCLOAK_REALM,
      clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
    })
  }

  return keycloakClient
}
