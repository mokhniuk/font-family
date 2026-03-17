import { createClient } from '@supabase/supabase-js';

// In Docker, env vars are injected at container start via /env-config.js → window.__env__.
// In local dev, Vite reads from .env.local and replaces import.meta.env at build time.
const runtimeEnv = (window as any).__env__ ?? {};
const supabaseUrl: string = runtimeEnv.SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey: string = runtimeEnv.SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration.\n\n' +
    'Local dev: create a .env.local file with:\n' +
    '  VITE_SUPABASE_URL=https://your-project-id.supabase.co\n' +
    '  VITE_SUPABASE_ANON_KEY=your-anon-key\n\n' +
    'Docker: set environment variables:\n' +
    '  SUPABASE_URL=https://your-project-id.supabase.co\n' +
    '  SUPABASE_ANON_KEY=your-anon-key'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
