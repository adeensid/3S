import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-[var(--color-accent)] text-[var(--color-accent-ink)] border border-[var(--color-accent)] hover:opacity-90',
  secondary:
    'bg-[var(--color-surface)] text-[var(--color-ink)] border border-[var(--color-border-strong)] hover:bg-[var(--color-surface-sunken)]',
  ghost:
    'bg-transparent text-[var(--color-ink)] border border-transparent hover:bg-[var(--color-surface-sunken)]',
};

export function Button({ variant = 'secondary', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex h-9 items-center justify-center rounded px-3 text-sm transition-[background-color,opacity] duration-[var(--motion-fast)] disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
