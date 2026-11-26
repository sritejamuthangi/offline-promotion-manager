import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createServer } from 'vite';

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
} finally {
  await server.close();
}
