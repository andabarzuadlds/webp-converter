/**
 * Formatea bytes a KB con 2 decimales.
 */
export function formatBytes(bytes: number): string {
  const kb = bytes / 1024;
  return `${kb.toFixed(2)} KB`;
}
