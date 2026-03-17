# Font Family

[![Docker Image Size](https://img.shields.io/docker/image-size/mokhniuk/font-family/latest)](https://hub.docker.com/r/mokhniuk/font-family)
[![Docker Pulls](https://img.shields.io/docker/pulls/mokhniuk/font-family)](https://hub.docker.com/r/mokhniuk/font-family)

**Font Family** is a self-hosted font CDN with an intuitive admin interface. It's your personal alternative to Google Fonts—upload your fonts once and serve them with a simple URL in any of your projects.

## Key Features

- **Self-hosted CDN**: Serve fonts from your own Supabase instance.
- **Two Storage Modes**: 
  - **Supabase mode**: Full CDN functionality with shared storage across all devices.
  - **Local mode**: No configuration needed; fonts are stored in your browser's IndexedDB.
- **Admin Interface**: A beautiful dashboard to upload, manage, and preview your font library.
- **Live Previews**: Test fonts with custom text, adjust weights, and see pairings directly in the browser.
- **Code Generation**: Instant snippets for `@import`, `<link>`, and `@font-face` CSS.
- **Search & Filters**: Organize and find your fonts by category, style, or favorites.

## Quick Start

### Docker

Run the application instantly without any local setup:

```bash
docker run -p 3000:80 \
  -e SUPABASE_URL=https://your-project.supabase.co \
  -e SUPABASE_ANON_KEY=your-anon-key \
  mokhniuk/font-family
```

### Docker Compose

Using a `docker-compose.yml` file:

```yaml
services:
  font-family:
    image: mokhniuk/font-family:latest
    ports:
      - "3000:80"
    environment:
      - SUPABASE_URL=https://your-project.supabase.co
      - SUPABASE_ANON_KEY=your-anon-key
```

## Configuration

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL (optional, enables CDN mode). |
| `SUPABASE_ANON_KEY` | Your Supabase anonymous API key (optional). |

*If no environment variables are provided, the app will default to **Local mode** (IndexedDB).*

## Source Code & Documentation

The full source code and setup instructions are available on [GitHub](https://github.com/mokhniuk/font-family).

---

Created by **Oleg Mokhniuk**.
