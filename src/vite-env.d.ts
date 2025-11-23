/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_GOOGLE_API_KEY: string; // Nueva variable de entorno
  readonly VITE_FAL_KEY: string; // Nueva variable de entorno
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}