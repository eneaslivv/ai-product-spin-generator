/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  // Agrega aquí cualquier otra variable de entorno que uses con el prefijo VITE_
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}