/** Turns `party-popper` into `Party popper` for labels and accessible names. */
export function humanize(value: string): string {
  const words = value.replace(/[-_]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
