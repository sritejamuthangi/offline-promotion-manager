/** Saves a file through the browser's normal download. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.append(link);
  link.click();
  link.remove();
  // Some browsers start reading the file after `click()` returns.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
