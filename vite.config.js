import { defineConfig } from 'vite';

export default defineConfig({
  base: '/talkflow/',
  root: '.',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 3001,
    open: true,
  },
});
