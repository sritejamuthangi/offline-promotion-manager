import { describe, expect, it } from 'vitest';
import { formatBytes, formatRelativeTime } from './format';

const now = Date.UTC(2026, 0, 15, 12, 0, 0);
const minute = 60_000;
const day = 24 * 60 * minute;

describe('formatRelativeTime', () => {
  it('describes recent and older times naturally', () => {
    expect(formatRelativeTime(now - 10_000, now, 'en')).toBe('now');
    expect(formatRelativeTime(now - 5 * minute, now, 'en')).toBe('5 minutes ago');
    expect(formatRelativeTime(now - 3 * 60 * minute, now, 'en')).toBe('3 hours ago');
    expect(formatRelativeTime(now - day, now, 'en')).toBe('yesterday');
    expect(formatRelativeTime(now - 14 * day, now, 'en')).toBe('2 weeks ago');
    expect(formatRelativeTime(now - 400 * day, now, 'en')).toBe('last year');
  });

  it('is localised', () => {
    expect(formatRelativeTime(now - day, now, 'es')).toBe('ayer');
  });
});

describe('formatBytes', () => {
  it('picks a readable unit', () => {
    expect(formatBytes(512, 'en')).toBe('512 byte');
    expect(formatBytes(1_500_000, 'en')).toBe('1.5 MB');
    expect(formatBytes(250_000_000_000, 'en')).toBe('250 GB');
  });
});
