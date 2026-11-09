import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Deezer's API sends no CORS headers, so the browser can't call it directly.
// The dev/preview server forwards /deezer/* to api.deezer.com instead.
// In production, netlify.toml does the same thing.
const proxy = {
  '/deezer': {
    target: 'https://api.deezer.com',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/deezer/, ''),
  },
};

export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
});
