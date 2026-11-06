import { defineConfig, type Plugin } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderStaticLinks } from './src/content/staticLinks.ts';

// Injects the static link list into index.html so it exists in the DOM before any JS runs.
function staticLinks(): Plugin {
  const file = resolve(import.meta.dirname, 'src/content/projects.json');
  return {
    name: 'static-links',
    transformIndexHtml(html) {
      const content = JSON.parse(readFileSync(file, 'utf8'));
      return html.replace('<!--STATIC_LINKS-->', renderStaticLinks(content));
    },
    handleHotUpdate(ctx) {
      if (ctx.file === file) ctx.server.ws.send({ type: 'full-reload' });
    },
  };
}

export default defineConfig({
  plugins: [staticLinks()],
  server: { port: 5190, strictPort: true },
  preview: { port: 5191, strictPort: true },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/three')) return 'three';
        },
      },
    },
  },
});
