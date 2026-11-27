import { describe, expect, it } from 'vitest';
import { googleVerificationMeta, pageMetadata, renderSeoHead } from './pages';

describe('Google site verification', () => {
  it('adds the meta tag only when a token is configured', () => {
    expect(googleVerificationMeta(undefined)).toBe('');
    expect(googleVerificationMeta('   ')).toBe('');
    expect(googleVerificationMeta(' token-123 ')).toBe(
      '<meta name="google-site-verification" content="token-123">',
    );
  });

  it('escapes the token so it cannot break the page head', () => {
    expect(googleVerificationMeta('a"b<c')).toBe(
      '<meta name="google-site-verification" content="a&quot;b&lt;c">',
    );
  });
});

describe('page metadata', () => {
  it('adds keywords and a social image to public pages', () => {
    const home = pageMetadata('/');
    expect(home.indexable).toBe(true);
    expect(home.keywords).toContain('poster maker');
    expect(home.keywords).toContain('free design tool');
    expect(home.image?.url).toBe('https://opm.sritejam.com/og-image.png');
    expect(home.image?.width).toBe(1200);
    expect(home.image?.height).toBe(630);

    const template = pageMetadata('/templates/business-card');
    expect(template.indexable).toBe(true);
    expect(template.keywords).toContain('networking');
    expect(template.keywords).toContain('professional');
    expect(template.keywords).toContain('card');
  });

  it('marks personal and local pages as not indexable without a social image', () => {
    expect(pageMetadata('/templates', true).indexable).toBe(false);
    expect(pageMetadata('/design/local-id').indexable).toBe(false);
    expect(pageMetadata('/design/local-id').image).toBeUndefined();
  });

  it('renders keywords, social image, locale, author and twitter card tags', () => {
    const html = renderSeoHead(pageMetadata('/'));
    expect(html).toContain('<meta data-seo name="keywords" content="');
    expect(html).toContain('property="og:image" content="https://opm.sritejam.com/og-image.png">');
    expect(html).toContain('property="og:image:type" content="image/png">');
    expect(html).toContain('property="og:image:width" content="1200">');
    expect(html).toContain('property="og:image:height" content="630">');
    expect(html).toContain('name="twitter:card" content="summary_large_image">');
    expect(html).toContain('name="twitter:image" content="https://opm.sritejam.com/og-image.png">');
    expect(html).toContain('<meta data-seo property="og:locale" content="en_GB">');
    expect(html).toContain('<meta data-seo name="author" content="Sriteja Muthangi">');
    expect(html).toContain('<script data-seo type="application/ld+json">');
  });
});
