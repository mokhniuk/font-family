/// <reference types="vite/client" />

interface Window {
  __env__?: {
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
  };
}
