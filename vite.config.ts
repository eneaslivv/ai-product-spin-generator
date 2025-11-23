import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Las variables de entorno de Vite ya se exponen con import.meta.env
        // No es necesario redefinir GEMINI_API_KEY aquí si ya se usa VITE_GOOGLE_API_KEY
        'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
        'import.meta.env.VITE_GOOGLE_API_KEY': JSON.stringify(env.VITE_GOOGLE_API_KEY), // Exponer al frontend
        'import.meta.env.VITE_FAL_KEY': JSON.stringify(env.VITE_FAL_KEY) // Exponer al frontend
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          // Explicitly alias react and react-dom to ensure a single instance
          'react': path.resolve(__dirname, 'node_modules/react'),
          'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
        }
      }
    };
});