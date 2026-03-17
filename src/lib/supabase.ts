import { createClient } from '@supabase/supabase-js';

// In Docker, env vars are injected at container start via /env-config.js → window.__env__.
// In local dev, Vite reads from .env.local and replaces import.meta.env at build time.
const runtimeEnv = (window as any).__env__ ?? {};
const supabaseUrl: string = runtimeEnv.SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey: string = runtimeEnv.SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

/** True when no Supabase credentials are present — app runs in local IndexedDB mode. */
export const isLocalMode = !supabaseUrl || !supabaseAnonKey;

// In local mode this client is never called, but we still initialise it so imports don't break.
export const supabase = createClient(
  supabaseUrl || 'http://localhost',
  supabaseAnonKey || 'placeholder',
);
