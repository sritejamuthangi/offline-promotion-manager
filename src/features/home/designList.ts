import type { Design } from '@/core/schema';

export const DESIGN_SORTS = ['updated', 'created', 'name'] as const;
export type DesignSort = (typeof DESIGN_SORTS)[number];

/** Filters designs by name (case-insensitive, any language) and sorts them. */
export function filterAndSortDesigns(
  designs: readonly Design[],
  query: string,
  sort: DesignSort,
  locale?: string,
): Design[] {
  const needle = query.trim().toLocaleLowerCase(locale);
  const result = needle
    ? designs.filter((d) => d.name.toLocaleLowerCase(locale).includes(needle))
    : [...designs];

  switch (sort) {
    case 'name': {
      const collator = new Intl.Collator(locale, { sensitivity: 'base', numeric: true });
      return result.sort((a, b) => collator.compare(a.name, b.name));
    }
    case 'created':
      return result.sort((a, b) => b.createdAt - a.createdAt);
    case 'updated':
      return result.sort((a, b) => b.updatedAt - a.updatedAt);
  }
}
