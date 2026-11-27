# Hosting and search indexing

The public deployment is **https://opm.sritejam.com**. Build with `npm run build` and publish `dist/`.
There is no application backend or account system.

## Public pages

The build generates 60 public pages from the bundled content:

- `/` and `/templates`
- `/templates/category/<category>` for seven categories
- `/templates/<template-id>` for every bundled template (currently 50)
- `/settings`

Static public assets served from `public/` are the icon, the favicon and the social preview
`og-image.png` (1200×630, rendered by `scripts/generate-og-image.mjs`).

Each has readable HTML before JavaScript, a unique title and description, an absolute canonical
URL, Open Graph/Twitter metadata and JSON-LD. The sitemap is generated from the same catalogue, so
adding a template also adds its public page and sitemap entry. Client-side navigation updates the
same metadata. No designs, uploaded images or saved templates from a browser enter the build.

Local `/design/<id>` routes load `editor.html` and carry `noindex, follow`. Unknown public routes
return a real HTTP 404. The `?category=mine` view contains personal saved templates and is noindex
after the app opens. Do not rewrite every unknown URL to the home page: this creates soft 404s.

## Offline app files

The build adds `sw.js` (the service worker), `manifest.webmanifest`, `offline-fonts.json` and the
icons in `icons/`. Requirements for offline use and installation:

- Serve the site over HTTPS (`localhost` works for testing).
- Serve `sw.js`, `manifest.webmanifest` and `offline-fonts.json` with `Cache-Control: no-cache`,
  so new versions reach people. `vercel.json` and the generated `_headers` (Netlify, Cloudflare
  Pages) set this, and mark the content-hashed files in `assets/` as immutable.
- Keep `sw.js` at the root of the base path; its scope is the whole app.

People keep the version they have until they choose **Update**, so a deployment never changes the
code under an open design. To withdraw offline support, publish a `sw.js` that unregisters itself
rather than deleting the file, because browsers keep a worker whose script disappears.

## Vercel

Import the repository, use `npm run build`, and publish `dist`. The checked-in `vercel.json`
provides public-page and local-editor rewrites. Add `opm.sritejam.com` to the project's custom
domains, then add the DNS record Vercel displays in the DNS settings for `sritejam.com`.

## Netlify or Cloudflare Pages

Use the same build command and output directory. `dist/_redirects` contains the public HTML routes,
the local editor fallback and a final 404 rule. Add `opm.sritejam.com` in the host's domain settings
and use its displayed DNS instructions. The generated `CNAME` also identifies the public domain.

## Other static hosts

Serve a public path from its directory's `index.html`. Route `/design/*` to `/editor.html`; serve
`404.html` with status 404 for unknown paths. For example, at the root of an nginx server:

```nginx
location /design/ { try_files /editor.html =404; }
location / { try_files $uri $uri/ =404; }
error_page 404 /404.html;
```

Hosts without rewrite support (such as GitHub Pages) can serve the public pages directly and use
the generated `404.html` to boot the client editor on deep links. Their initial response for a
local editor URL will be 404. The public sitemap URLs all have real files.

## Another domain or a sub-folder

The defaults are `VITE_SITE_URL=https://opm.sritejam.com` and `VITE_BASE_PATH=/`.
For a fork hosted at `https://example.org/studio`, set both at build time:

```text
VITE_SITE_URL=https://example.org/studio
VITE_BASE_PATH=/studio/
```

The site URL controls canonical URLs and the sitemap. The base path controls asset URLs, app
routing and static links. Publish the output at that base path and adapt the host's rewrites
accordingly (`vercel.json` assumes a root deployment). Old `/#/…` bookmarks are upgraded in the
browser to clean paths.

## Indexing after deployment

`npm run build` generates `robots.txt` and `sitemap.xml`; do not add or edit them in `public/`.
`robots.txt` allows crawling and points to the sitemap, and the sitemap lists every public page:
the home page, the catalogue, seven category pages, all 50 templates and Settings. Local designs,
saved templates and unknown routes are `noindex` and are not listed.

1. Open `https://opm.sritejam.com/robots.txt` and `/sitemap.xml` on the deployed host.
2. Check that a direct visit and reload at `/templates/restaurant-menu` work.
3. Verify the domain in Google Search Console (below) and Bing Webmaster Tools.
4. Submit `https://opm.sritejam.com/sitemap.xml` and request indexing for the home page.

### Google Search Console verification

Choose one method, then rebuild and redeploy:

- **Meta tag (recommended):** set `VITE_GOOGLE_SITE_VERIFICATION` to the `content` value Search
  Console shows, for example `abc123…`, in the host's build environment or in `.env.production`.
  The build adds `<meta name="google-site-verification" content="abc123…">` to every page.
- **Meta tag in the shell:** paste Google's full `<meta name="google-site-verification" …>` tag
  into the `<head>` of `index.html`. The prerender step keeps it on every generated page.
- **HTML file:** put the file Google gives you, such as `google1234.html`, in `public/`. It is
  copied to the site root and served at `https://opm.sritejam.com/google1234.html`.

Verification succeeds only after the new build is live at the domain. Then submit the sitemap in
Search Console. The same sitemap can be submitted to Bing Webmaster Tools.

The application makes public pages crawlable; search engines decide when to index them. DNS,
hosting and webmaster-tool verification are completed in the respective accounts.
