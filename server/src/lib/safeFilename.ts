const RESERVED = new Set(['CON', 'PRN', 'AUX', 'NUL']);

export function sanitizeAttachmentFilename(input: string): string {
  const trimmed = input.trim().replace(/[/\\?%*:|"<>]/g, '_');
  const normalized = trimmed.replace(/\.\.+/g, '.').replace(/^\.+/, '');
  const base = normalized.slice(0, 180) || 'attachment';
  const upper = base.toUpperCase().replace(/\..*$/, '');
  if (RESERVED.has(upper)) {
    return `file_${base}`;
  }
  return base;
}
