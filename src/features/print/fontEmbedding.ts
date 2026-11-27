import { type FaceInfo, selectFaces, type TextRun } from '@/core/print';
import { parseUnicodeRange } from '@/core/unicode';

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

function* fontFaceRules(rules: CSSRuleList): Generator<CSSFontFaceRule> {
  for (const rule of rules) {
    if (rule instanceof CSSFontFaceRule) yield rule;
    else if (rule instanceof CSSImportRule) {
      if (rule.styleSheet) yield* fontFaceRules(rule.styleSheet.cssRules);
    } else if ('cssRules' in rule && rule.cssRules instanceof CSSRuleList)
      yield* fontFaceRules(rule.cssRules);
  }
}

const unquote = (value: string) => value.trim().replace(/^(['"])(.*)\1$/, '$2');

interface DocumentFace extends FaceInfo {
  rule: CSSFontFaceRule;
}

/** Every `@font-face` rule of the app's own stylesheets. */
function documentFaces(): DocumentFace[] {
  const faces: DocumentFace[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // Stylesheets from other sites can't be read; the app has none.
    }
    for (const rule of fontFaceRules(rules)) {
      const style = rule.style;
      faces.push({
        rule,
        family: unquote(style.getPropertyValue('font-family')),
        style: style.getPropertyValue('font-style').trim() || 'normal',
        ranges: parseUnicodeRange(style.getPropertyValue('unicode-range')),
      });
    }
  }
  return faces;
}

async function inlineFace({ rule, family }: DocumentFace): Promise<string> {
  const style = rule.style;
  const source = /url\(\s*(['"]?)([^'")]+)\1\s*\)/.exec(style.getPropertyValue('src'))?.[2];
  if (!source) return '';
  const base = rule.parentStyleSheet?.href ?? document.baseURI;
  const data = await fontDataUrl(new URL(source, base).href);
  const descriptors = ['font-style', 'font-weight', 'font-stretch', 'unicode-range']
    .map((name) => [name, style.getPropertyValue(name).trim()] as const)
    .filter(([, value]) => value)
    .map(([name, value]) => `${name}:${value}`);
  return `@font-face{font-family:${JSON.stringify(family)};src:url(${data});font-display:block;${descriptors.join(';')}}`;
}

/**
 * `@font-face` rules with the font files inlined, for exactly the faces the browser draws
 * the text with. An exported image can't load fonts from the app, so they travel inside it.
 * The chosen fonts must load; a writing-system fallback that can't be loaded (offline, not
 * yet downloaded) is left out, and the device's own fonts draw that text instead.
 */
export async function embeddedFontCss(runs: readonly TextRun[]): Promise<string> {
  const needed = selectFaces(documentFaces(), runs);
  const css = await Promise.all(
    [...needed].map(([face, required]) =>
      required
        ? inlineFace(face)
        : inlineFace(face).catch((error: unknown) => {
            console.warn(`Export continues without ${face.family}`, error);
            return '';
          }),
    ),
  );
  return css.join('');
}
