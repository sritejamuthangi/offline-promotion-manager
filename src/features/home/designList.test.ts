import { describe, expect, it } from 'vitest';
import { createDesign } from '@/core/design/factory';
import { filterAndSortDesigns } from './designList';

const design = (name: string, createdAt: number, updatedAt: number) => ({
  ...createDesign({ name, width: 100, height: 100, unit: 'px', now: createdAt }),
  updatedAt,
});

const designs = [
  design('Poster 10', 1, 30),
  design('poster 2', 2, 10),
  design('Business card', 3, 20),
  design('Événement', 4, 5),
];

const names = (list: { name: string }[]) => list.map((d) => d.name);

describe('filterAndSortDesigns', () => {
  it('sorts by last edit, creation date or name', () => {
    expect(names(filterAndSortDesigns(designs, '', 'updated', 'en'))).toEqual([
      'Poster 10',
      'Business card',
      'poster 2',
      'Événement',
    ]);
    expect(names(filterAndSortDesigns(designs, '', 'created', 'en'))).toEqual([
      'Événement',
      'Business card',
      'poster 2',
      'Poster 10',
    ]);
    // Natural order: "2" before "10"; accents sort with their base letter.
    expect(names(filterAndSortDesigns(designs, '', 'name', 'en'))).toEqual([
      'Business card',
      'Événement',
      'poster 2',
      'Poster 10',
    ]);
  });

  it('filters by name, ignoring case', () => {
    expect(names(filterAndSortDesigns(designs, '  POSTER ', 'name', 'en'))).toEqual([
      'poster 2',
      'Poster 10',
    ]);
    expect(filterAndSortDesigns(designs, 'nothing', 'name', 'en')).toEqual([]);
  });

  it('does not change the original list', () => {
    const before = names(designs);
    filterAndSortDesigns(designs, '', 'name', 'en');
    expect(names(designs)).toEqual(before);
  });
});
