# Font Family

A self-hosted font CDN with an admin interface. Upload your fonts once, serve them from a real URL in any project — your own alternative to Google Fonts.

Built with React + Vite + TypeScript + Supabase.

Created by **Oleg Mokhniuk**.

## Features

- **Self-hosted CDN** — fonts stored in Supabase Storage with public URLs you can link to from any project
- **Admin auth** — upload/edit/delete gated behind Supabase Auth; public browsing requires no login
- **Upload fonts** — drag-and-drop WOFF2, WOFF, TTF, OTF, EOT with auto-detection of weight and style from filename
- **Live preview** — type custom text, adjust size, preview each weight/style
- **CDN-ready code snippets** — `@import`, `<link>`, and raw `@font-face` CSS with real hosted URLs
- **Font metadata** — name, category, author, description, license; all editable
- **Search & filters** — by name, category, style, favorites
- **Dark/light mode**, grid/list view

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
│   └── fontDB.ts             # All DB + Storage CRUD, CSS generation
├── hooks/
│   └── useFonts.ts           # Font state, loading, @font-face injection
├── pages/
│   ├── Index.tsx             # Main library
│   ├── FontDetail.tsx        # Single font detail + code snippets
│   └── Login.tsx             # Admin login (/login)
└── components/
    ├── Header.tsx            # Nav with login/logout
    ├── FontUploader.tsx      # Upload dialog (admin only)
    ├── FontCard.tsx          # Font card with preview + code
    ├── FontEditor.tsx        # Edit metadata + files (admin only)
    ├── FontGrid.tsx          # Grid/list layout
    ├── FontFilters.tsx       # Category/style/favorites filters
    └── SearchBar.tsx         # Search + preview controls

supabase/
├── schema.sql                # Full DB + storage setup SQL
└── functions/
    └── font-css/
        └── index.ts          # Edge Function: returns @font-face CSS for a font ID
```

## Development

```sh
npm run dev      # start dev server (localhost:8080)
npm run build    # production build
npm run lint     # lint
```

## License

MIT
