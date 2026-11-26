import { useLocation } from '@tanstack/react-router';
import { useEffect } from 'react';
import { pageMetadata, renderSeoHead } from './pages';

export function PageSeo() {
  const location = useLocation();
  useEffect(() => {
    // TanStack's internal location already excludes the configured basepath.
    const path = location.pathname;
    const search = location.search as { category?: unknown };
    const html = renderSeoHead(pageMetadata(path, search.category === 'mine'));
    const fragment = document.createElement('template');
    fragment.innerHTML = html;
    for (const tag of document.head.querySelectorAll('[data-seo]')) tag.remove();
    document.head.append(fragment.content);
  }, [location.pathname, location.search]);
  return null;
}
