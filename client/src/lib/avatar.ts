const palette = ['#6b7280', '#2f7d4f', '#1f6f5c', '#b7791f', '#8b5a2b', '#4b5563'];

export function avatarColorFromId(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash + userId.charCodeAt(i) * (i + 1)) % 2147483647;
  }
  const index = hash % palette.length;
  const color = palette[index];
  return color ?? '#6b7280';
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
}
