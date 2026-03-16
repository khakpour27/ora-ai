#!/bin/sh
# Generate runtime config from environment variables
# This allows VITE_GEMINI_API_KEY to be set as a standard Dokploy env var

cat <<EOF > /usr/share/nginx/html/runtime-config.js
window.__RUNTIME_CONFIG__ = {
  VITE_GEMINI_API_KEY: "${VITE_GEMINI_API_KEY:-}",
  API_URL: "${API_URL:-}"
};
EOF

exec "$@"
