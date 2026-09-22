import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isDev = mode === 'development';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        strictPort: true,
        hmr: {
          overlay: true,
          // Explicitly set port and host for HMR to avoid SW interception
          port: 3000,
          host: '0.0.0.0'
        }
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          // Disable SW in dev mode to prevent module graph / HMR interference
          devOptions: {
            enabled: false,
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
            cleanupOutdatedCaches: true,
            clientsClaim: true,
            skipWaiting: true,
            navigateFallback: 'index.html',
            // Ensure internal Vite requests aren't intercepted if SW is somehow active
            navigateFallbackAllowlist: [/^(?!\/__).*/],
          },
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
          manifest: {
            name: 'System Sentinel Platform',
            short_name: 'System Sentinel',
            description: 'Enterprise-grade System Diagnostics and Repair Platform',
            theme_color: '#020617',
            background_color: '#020617',
            display: 'standalone',
            orientation: 'any',
            icons: [
              {
                src: 'pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png'
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
              }
            ]
          }
        })
      ],
      define: {
        // Safe injection of environment variables
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
