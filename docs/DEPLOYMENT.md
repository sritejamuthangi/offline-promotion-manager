# Hosting and search indexing

The public deployment is **https://opm.sritejam.com**. Build with `npm run build` and publish `dist/`.
There is no application backend or account system.

## Public pages

The build generates 24 public pages from the bundled content:

- `/` and `/templates`
- `/templates/category/<category>` for seven categories
- `/templates/<template-id>` for every bundled template (currently 14)
- `/settings`

Each has readable HTML before JavaScript, a unique title and description, an absolute canonical
URL, Open Graph/Twitter metadata and JSON-LD. The sitemap is generated from the same catalogue, so
adding a template also adds its public page and sitemap entry. Client-side navigation updates the
same metadata. No designs, uploaded images or saved templates from a browser enter the build.

Local `/design/<id>` routes load `editor.html` and carry `noindex, follow`. Unknown public routes
return a real HTTP 404. The `?category=mine` view contains personal saved templates and is noindex
after the app opens. Do not rewrite every unknown URL to the home page: this creates soft 404s.

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

1. Open `https://opm.sritejam.com/robots.txt` and `/sitemap.xml` on the deployed host.
2. Check that a direct visit and reload at `/templates/restaurant-menu` work.
3. Verify the domain in Google Search Console and Bing Webmaster Tools.
4. Submit `https://opm.sritejam.com/sitemap.xml` and request indexing for the home page.

The application makes public pages crawlable; search engines decide when to index them. DNS,
hosting and webmaster-tool verification are completed in the respective accounts.
