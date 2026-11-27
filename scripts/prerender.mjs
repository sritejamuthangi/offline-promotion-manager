import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { build, createServer } from 'vite';

const outDir = resolve(process.argv[2] || 'dist');

// Vite resolves the same aliases, env and TS/JSX as the client build. No listening server,
// browser or IndexedDB is involved; public content comes only from the bundled catalogue.
const server = await createServer({
  mode: 'production',
  server: { middlewareMode: true, watch: null },
  appType: 'custom',
});
try {
  const shell = await readFile(resolve(outDir, 'index.html'), 'utf8');
  const { renderPublicFiles } = await server.ssrLoadModule('/src/seo/prerender.tsx');
  const files = renderPublicFiles(shell);
  for (const file of files) {
    const target = resolve(outDir, file.path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, file.content, 'utf8');
  }
  const pkg = JSON.parse(await readFile('package.json', 'utf8'));
  const packages = Object.keys(pkg.dependencies).filter(
    (name) => name.startsWith('@fontsource') || ['lucide-react', 'uqr'].includes(name),
  );
  const notices = await Promise.all(
    packages.map(async (name) => {
      const license = await readFile(resolve('node_modules', name, 'LICENSE'), 'utf8');
      return `${name}\n${'='.repeat(name.length)}\n\n${license}`;
    }),
  );
  await writeFile(resolve(outDir, 'THIRD-PARTY-NOTICES.txt'), notices.join('\n\n'), 'utf8');
  console.log(
    `Pre-rendered ${files.filter((file) => file.path.endsWith('/index.html') || file.path === 'index.html').length} public pages, sitemap, robots and host routing.`,
  );

  // Offline use: the service worker saves the app's files (see src/pwa/sw.ts).
  const { planOffline } = await server.ssrLoadModule('/src/pwa/plan.ts');
  const { FONTS_MANIFEST } = await server.ssrLoadModule('/src/pwa/constants.ts');
  const built = (await readdir(outDir, { recursive: true, withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => relative(outDir, resolve(entry.parentPath, entry.name)).split(sep).join('/'))
    .filter((file) => file !== FONTS_MANIFEST && file !== 'sw.js');
  const plan = planOffline(built);
  // The version changes whenever a saved file does, so browsers install the new files.
  const hash = createHash('sha256');
  for (const file of plan.precache)
    hash.update(`${file}\n`).update(await readFile(resolve(outDir, file)));
  const version = hash.digest('hex').slice(0, 16);
  let bytes = 0;
  for (const file of plan.fonts) bytes += (await stat(resolve(outDir, file))).size;
  await writeFile(
    resolve(outDir, FONTS_MANIFEST),
    `${JSON.stringify({ version, files: plan.fonts, bytes })}\n`,
    'utf8',
  );
  await build({
    configFile: false,
    logLevel: 'warn',
    publicDir: false,
    define: {
      __PRECACHE__: JSON.stringify([...plan.precache, FONTS_MANIFEST]),
      __FONTS__: JSON.stringify(plan.fonts),
      __VERSION__: JSON.stringify(version),
    },
    build: {
      outDir,
      emptyOutDir: false,
      copyPublicDir: false,
      sourcemap: false,
      reportCompressedSize: false,
      target: 'es2020',
      lib: {
        entry: resolve('src/pwa/sw.ts'),
        name: 'opmServiceWorker',
        formats: ['iife'],
        fileName: () => 'sw.js',
      },
    },
  });
  console.log(
    `Service worker ${version}: ${plan.precache.length + 1} files saved for offline use, ${plan.fonts.length} writing-system font files (${(bytes / 1024 / 1024).toFixed(1)} MB) saved when used.`,
  );
} finally {
  await server.close();
}
