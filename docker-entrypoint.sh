#!/bin/sh
set -e

# Validate required env vars
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  echo ""
  echo "ERROR: Missing required environment variables."
  echo ""
  echo "  SUPABASE_URL       — your Supabase project URL"
  echo "  SUPABASE_ANON_KEY  — your Supabase anon/public key"
  echo ""
  echo "Example:"
  echo "  docker run -e SUPABASE_URL=https://xxx.supabase.co \\"
  echo "             -e SUPABASE_ANON_KEY=eyJ... \\"
  echo "             mokhniuk/font-family"
  echo ""
  exit 1
fi

# Write runtime env config — read by the app via window.__env__
cat > /usr/share/nginx/html/env-config.js <<EOF
window.__env__ = {
  SUPABASE_URL: "${SUPABASE_URL}",
  SUPABASE_ANON_KEY: "${SUPABASE_ANON_KEY}"
};
EOF

echo "Font Family starting — Supabase: ${SUPABASE_URL}"

exec nginx -g "daemon off;"
