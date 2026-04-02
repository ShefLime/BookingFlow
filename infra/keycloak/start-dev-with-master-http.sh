#!/bin/sh
set -eu

/opt/keycloak/bin/kc.sh start-dev --import-realm &
keycloak_pid=$!

trap 'kill "$keycloak_pid" 2>/dev/null || true' INT TERM

until /opt/keycloak/bin/kcadm.sh config credentials \
  --server http://localhost:8080 \
  --realm master \
  --user "${KC_BOOTSTRAP_ADMIN_USERNAME}" \
  --password "${KC_BOOTSTRAP_ADMIN_PASSWORD}" >/dev/null 2>&1
do
  sleep 2
done

/opt/keycloak/bin/kcadm.sh update realms/master \
  --server http://localhost:8080 \
  -s sslRequired=NONE >/dev/null

wait "$keycloak_pid"
