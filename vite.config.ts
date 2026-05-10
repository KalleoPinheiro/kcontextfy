import { copyFileSync, cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/popup.html'),
        background: resolve(__dirname, 'src/background/background.ts'),
        content: resolve(__dirname, 'src/content/content.ts'),
      },
      output: {
        dir: 'dist',
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          const fileName = assetInfo.name;
          if (fileName.endsWith('.html')) {
            return '[name].[ext]';
          }
          return '[name].[ext]';
        },
      },
      external: ['chrome'],
    },
    manifest: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [
    {
      name: 'copy-manifest',
      closeBundle() {
        mkdirSync(resolve(__dirname, 'dist'), { recursive: true });
        copyFileSync(
          resolve(__dirname, 'src/manifest.json'),
          resolve(__dirname, 'dist/manifest.json')
        );
        cpSync(resolve(__dirname, 'src/icons'), resolve(__dirname, 'dist/icons'), {
          recursive: true,
        });
        // Move popup.html and fix relative paths
        try {
          let html = readFileSync(resolve(__dirname, 'dist/src/popup/popup.html'), 'utf-8');
          // Fix relative paths: ../../popup.js -> ./popup.js
          html = html.replace(/src="\.\.\/\.\.\//g, 'src="./');
          html = html.replace(/href="\.\.\/\.\.\//g, 'href="./');
          // Add defer to module script so DOM loads first
          html = html.replace(
            /<script type="module" crossorigin src="/,
            '<script type="module" defer crossorigin src="'
          );
          writeFileSync(resolve(__dirname, 'dist/popup.html'), html);
          rmSync(resolve(__dirname, 'dist/src'), { recursive: true, force: true });
        } catch (e) {
          // ignore if src doesn't exist
        }
      },
    },
  ],
});
