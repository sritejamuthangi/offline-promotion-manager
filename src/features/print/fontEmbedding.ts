import { coversAny, parseUnicodeRange } from '@/core/print';

/** Reads a blob as a `data:` URL. */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

const fontFiles = new Map<string, Promise<string>>();

/** Bundled font files, fetched once from the app's own files (and the offline cache). */
function fontDataUrl(url: string): Promise<string> {
  let pending = fontFiles.get(url);
  if (!pending) {
    pending = fetch(url, { cache: 'force-cache', signal: AbortSignal.timeout(30_000) })
      .then((response) => {
        if (!response.ok) throw new Error('An export font could not be loaded.');
        return response.blob();
      })
      .then(blobToDataUrl)
      .catch((error: unknown) => {
        fontFiles.delete(url);
        throw error;
      });
    fontFiles.set(url, pending);
  }
  return pending;
}

function* fontFaces(rules: CSSRuleList): Generator<CSSFontFaceRule> {
  for (const rule of rules) {
    if (rule instanceof CSSFontFaceRule) yield rule;
    else if (rule instanceof CSSImportRule) {
      if (rule.styleSheet) yield* fontFaces(rule.styleSheet.cssRules);
    } else if ('cssRules' in rule && rule.cssRules instanceof CSSRuleList)
      yield* fontFaces(rule.cssRules);
  }
}

const unquote = (value: string) => value.trim().replace(/^(['"])(.*)\1$/, '$2');

/**
 * `@font-face` rules with the font files inlined, for the given families and only the
 * character subsets the text needs. Exported images draw text with these, since an image
 * cannot load fonts from the app.
 */
export async function embeddedFontCss(
  families: ReadonlyMap<string, ReadonlySet<string>>,
  codePoints: ReadonlySet<number>,
): Promise<string> {
  const faces: Promise<string>[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // Stylesheets from other sites can't be read; the app has none.
    }
    for (const rule of fontFaces(rules)) {
      const style = rule.style;
      const family = unquote(style.getPropertyValue('font-family'));
      if (!families.get(family)?.has(style.getPropertyValue('font-style').trim() || 'normal'))
        continue;
      const range = style.getPropertyValue('unicode-range').trim();
      if (range && !coversAny(parseUnicodeRange(range), codePoints)) continue;
      const source = /url\(\s*(['"]?)([^'")]+)\1\s*\)/.exec(style.getPropertyValue('src'))?.[2];
      if (!source) continue;
      const base = rule.parentStyleSheet?.href ?? document.baseURI;
      const descriptors = ['font-style', 'font-weight', 'font-stretch', 'unicode-range']
        .map((name) => [name, style.getPropertyValue(name).trim()] as const)
        .filter(([, value]) => value)
        .map(([name, value]) => `${name}:${value}`);
      faces.push(
        fontDataUrl(new URL(source, base).href).then((data) =>
          data
            ? `@font-face{font-family:${JSON.stringify(family)};src:url(${data});font-display:block;${descriptors.join(';')}}`
            : '',
        ),
      );
    }
  }
  return (await Promise.all(faces)).join('');
}
