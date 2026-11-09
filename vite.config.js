import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Deezer's API sends no CORS headers, so the browser can't call it directly.
// The dev/preview server forwards /deezer/* to api.deezer.com instead.
// MusicBrainz is proxied too so we can send the identifying User-Agent it asks for.
const proxy = {
  '/deezer': {
    target: 'https://api.deezer.com',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/deezer/, ''),
  },
  '/musicbrainz': {
    target: 'https://musicbrainz.org',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/musicbrainz/, ''),
    headers: { 'User-Agent': 'TimelineTunes/0.1 (hobby project)' },
  },
};

export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
});
