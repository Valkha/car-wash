import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { globSync } from 'tinyglobby';
import { resolve } from 'path';

// Discover every HTML page in the project, excluding build artefacts
const htmlFiles = globSync('**/*.html', {
  ignore: ['node_modules/**', 'dist/**', '.claude/**']
});

// Build the Rollup input map: { 'services_cologny_index': '/abs/path/index.html', ... }
const input = Object.fromEntries(
  htmlFiles.map(file => [
    file.replace(/\.html$/, '').replace(/[/\\]/g, '_'),
    resolve(file)
  ])
);

export default defineConfig({
  plugins: [tailwindcss()],
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: { input }
  }
});
