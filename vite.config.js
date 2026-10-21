import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Đường dẫn tương đối giúp web chạy mượt trên GitHub Pages (subpath /dkworld/)
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
  },
});
