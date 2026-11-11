import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, id, className = '', ...props },
  ref,
) {
  const inputId = id ?? props.name;
  return (
    <label className="block space-y-1" htmlFor={inputId}>
      <span className="text-sm text-[var(--color-ink)]">{label}</span>
      <input
        ref={ref}
        id={inputId}
        className={`h-9 w-full rounded border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-ink)] transition-[border-color] duration-[var(--motion-fast)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-accent)] ${className}`}
        {...props}
      />
      {error ? <span className="text-xs text-[var(--color-status-red)]">{error}</span> : null}
    </label>
  );
});
