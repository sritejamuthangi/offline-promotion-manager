import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

/** Preview uses real HTML and 404 responses, matching the deployment routing rules. */
const previewRouting: Plugin = {
  name: 'preview-public-pages',
  configurePreviewServer(server) {
    const base = server.config.base.replace(/\/$/, '');
    const outDir = resolve(server.config.root, server.config.build.outDir);
    server.middlewares.use((req, _res, next) => {
      const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
      if (pathname.startsWith(`${base}/design/`)) req.url = `${base}/editor.html`;
      else if (pathname.startsWith(`${base}/`)) {
        const route = pathname.slice(base.length).replace(/\/$/, '');
        // Match only safe route segments; assets continue through Vite's static server.
        if (
          /^(\/[a-z0-9-]+)*$/i.test(route) &&
          existsSync(resolve(outDir, `.${route}/index.html`))
        ) {
          req.url = `${base}${route}/index.html`;
        }
      }
      next();
    });
    return () => {
      server.middlewares.use((_req, res) => {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(readFileSync(resolve(outDir, '404.html')));
      });
    };
  },
};

export default defineConfig(({ mode, isPreview }) => ({
  base: loadEnv(mode, process.cwd()).VITE_BASE_PATH || '/',
  appType: isPreview ? 'mpa' : 'spa',
  plugins: [react(), tailwindcss(), previewRouting],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
}));
