# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build with placeholder values. Real values are injected at runtime via
# docker-entrypoint.sh → window.__env__, so these are never actually used.
RUN VITE_SUPABASE_URL=placeholder VITE_SUPABASE_ANON_KEY=placeholder npm run build

# ── Stage 2: Serve ─────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Copy built SPA
COPY --from=builder /app/dist /usr/share/nginx/html

# Replace default nginx config with our SPA config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Entrypoint writes env-config.js then starts nginx
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
