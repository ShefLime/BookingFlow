import Keycloak from 'keycloak-js'

const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL ?? 'http://localhost:8081'
const keycloakRealm = import.meta.env.VITE_KEYCLOAK_REALM ?? 'bookingflow'
const keycloakClientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'bookingflow-frontend'

let keycloakInstance: Keycloak | null = null
let initPromise: Promise<boolean> | null = null

export function getKeycloak() {
  if (!keycloakInstance) {
    keycloakInstance = new Keycloak({
      url: keycloakUrl,
      realm: keycloakRealm,
      clientId: keycloakClientId,
    })
  }

  return keycloakInstance
}

export function initializeKeycloak() {
  if (!initPromise) {
    const keycloak = getKeycloak()

    initPromise = keycloak.init({
      onLoad: 'check-sso',
      pkceMethod: 'S256',
      checkLoginIframe: false,
      silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
    })
  }

  return initPromise
}
