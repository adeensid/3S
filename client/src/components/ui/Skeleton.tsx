export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-[var(--color-surface-sunken)] ${className}`}
      aria-hidden
    />
  );
}
