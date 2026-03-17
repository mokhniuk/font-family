# Font Family

A self-hosted font CDN with an admin interface. Upload your fonts once, serve them from a real URL in any project — your own alternative to Google Fonts.

Built with React + Vite + TypeScript + Supabase.

Created by **Oleg Mokhniuk**.

## Features

- **Self-hosted CDN** — fonts stored in Supabase Storage with public URLs you can link to from any project
- **Admin auth** — upload/edit/delete gated behind Supabase Auth; public browsing requires no login
- **Upload fonts** — drag-and-drop WOFF2, WOFF, TTF, OTF, EOT with auto-detection of weight and style from filename
- **Live preview** — type custom text, adjust size with a slider, preview each weight/style
- **Font detail modal** — click any card to open an animated overlay with full details: all styles, type samples, pairing ideas, and code snippets
- **CDN-ready code snippets** — `@import`, `<link>`, and raw `@font-face` CSS with real hosted URLs
- **Font metadata** — name, category, author, description, license; all editable
- **Favorites** — heart any font; state persists in localStorage and stays in sync across views
- **Search & filters** — by name, category (serif/sans-serif/monospace/display/handwriting), style (italic/bold), and favorites
- **Grid and list view**, dark/light mode

## Tech Stack

| Layer        | Technology                                          |
| ------------ | --------------------------------------------------- |
| Frontend     | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui |
| Auth         | Supabase Auth                                       |
| Database     | Supabase Postgres                                   |
| Storage      | Supabase Storage (public `fonts` bucket)            |
| CSS endpoint | Supabase Edge Function (`font-css`)                 |

## Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) and create a new project.

### 2. Run the schema

In your Supabase dashboard → **SQL Editor**, paste and run [`supabase/schema.sql`](./supabase/schema.sql).

This creates:

- `font_families` and `font_files` tables
- Row-level security policies (public read, authenticated write)
- `fonts` storage bucket (public) with storage policies

### 3. Configure environment variables

Create a `.env.local` file:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Both values are in **Supabase dashboard → Project Settings → API**.

### 4. Create an admin user

In Supabase dashboard → **Authentication → Users → Add user**.
This account is used to upload and manage fonts. Public visitors can browse without an account.

### 5. Install and run

```sh
npm install
npm run dev
```

### 6. Deploy the CSS Edge Function (optional)

Enables `@import url(...)` and `<link rel="stylesheet">` usage in other projects.

```sh
npx supabase login
npx supabase link --project-ref your-project-id
npx supabase functions deploy font-css --no-verify-jwt
```

Without this, the **@font-face tab** in "Get Code" still works — paste the CSS directly into your project and it loads fonts straight from Supabase Storage.

## Using fonts in other projects

Open any font → click **Get Code**. Three options:

### Option A — CSS @import (requires Edge Function)

```css
@import url("https://your-project.supabase.co/functions/v1/font-css?id=FONT_ID");

.heading {
  font-family: "Your Font", sans-serif;
}
```

### Option B — HTML link tag (requires Edge Function)

```html
<link
  rel="stylesheet"
  href="https://your-project.supabase.co/functions/v1/font-css?id=FONT_ID"
/>
```

### Option C — Paste @font-face directly (no Edge Function needed)

```css
@font-face {
  font-family: "Your Font";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("https://your-project.supabase.co/storage/v1/object/public/fonts/...")
    format("woff2");
}
```

## Custom domain for fonts

To serve fonts from your own subdomain (e.g. `fonts.yourdomain.com`) instead of Supabase URLs:

- **Cloudflare Workers** — free proxy in ~20 lines, works with any domain on Cloudflare
- **Supabase Custom Domain** — built-in support, requires Pro plan
- **Nginx/Caddy reverse proxy** — if you have a VPS
- **Cloudflare R2** — replace Supabase Storage with R2, which has native custom domain support and zero egress fees

## Project structure

```
src/
├── contexts/
│   └── AuthContext.tsx       # Supabase auth state (user, signIn, signOut)
├── lib/
│   ├── supabase.ts           # Supabase client
│   └── fontDB.ts             # All DB + Storage CRUD, CSS generation helpers
├── hooks/
│   ├── useFonts.ts           # Font list state, loading, error, @font-face injection
│   └── useFavorites.ts       # Favorites set, persisted to localStorage
├── pages/
│   ├── Index.tsx             # Main library (search, filters, grid)
│   ├── FontDetail.tsx        # Single font full-page view
│   └── Login.tsx             # Admin login (/login)
└── components/
    ├── Header.tsx            # Nav with theme toggle and login/logout
    ├── FontUploader.tsx      # Upload dialog (admin only)
    ├── FontCard.tsx          # Font card with preview, category badge, actions
    ├── FontDetailModal.tsx   # Animated overlay modal (expands from card)
    ├── FontEditor.tsx        # Edit metadata + files (admin only)
    ├── FontGrid.tsx          # Grid/list layout with empty states
    ├── FontFilters.tsx       # Category/style/favorites/view-mode filters
    └── SearchBar.tsx         # Search + preview text/size controls

supabase/
├── schema.sql                # Full DB + storage setup SQL
└── functions/
    └── font-css/
        └── index.ts          # Edge Function: returns @font-face CSS for a font ID
```

## Docker

The app is published to Docker Hub as [`mokhniuk/font-family`](https://hub.docker.com/r/mokhniuk/font-family). No Node.js required — it's a static SPA served by nginx.

### Quick start

```sh
docker run -p 3000:80 \
  -e SUPABASE_URL=https://your-project-id.supabase.co \
  -e SUPABASE_ANON_KEY=your-anon-key \
  mokhniuk/font-family
```

Open http://localhost:3000.

### With docker-compose

```sh
# Create a .env file
echo "SUPABASE_URL=https://your-project-id.supabase.co" > .env
echo "SUPABASE_ANON_KEY=your-anon-key" >> .env

docker compose up -d
```

### Build locally

```sh
docker build -t font-family .
docker run -p 3000:80 \
  -e SUPABASE_URL=https://your-project-id.supabase.co \
  -e SUPABASE_ANON_KEY=your-anon-key \
  font-family
```

### Environment variables

| Variable            | Required | Description                       |
| ------------------- | -------- | --------------------------------- |
| `SUPABASE_URL`      | Yes      | Your Supabase project URL         |
| `SUPABASE_ANON_KEY` | Yes      | Your Supabase anon/public API key |

### Publishing to Docker Hub

Push a version tag to trigger the GitHub Actions workflow:

```sh
git tag v1.0.0
git push origin v1.0.0
```

This builds multi-arch images (`linux/amd64`, `linux/arm64`) and pushes:

- `mokhniuk/font-family:1.0.0`
- `mokhniuk/font-family:1.0`
- `mokhniuk/font-family:latest`

Requires two GitHub Actions secrets: `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` (create a token at Docker Hub → Account Settings → Security).

## Development

```sh
npm install
npm run dev      # start dev server (localhost:8080)
npm run build    # production build
npm run lint     # lint
```

## License

MIT
