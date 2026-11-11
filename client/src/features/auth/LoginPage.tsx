import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ApiError } from '../../lib/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from './AuthProvider';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        className="w-full max-w-sm space-y-4 rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
        onSubmit={handleSubmit(async (values) => {
          try {
            await login(values.email, values.password);
            navigate('/');
          } catch (error) {
            const message =
              error instanceof ApiError
                ? error.message
                : 'Could not sign in. Check your connection and try again.';
            setError('root', { message });
          }
        })}
      >
        <div>
          <p className="text-lg font-semibold text-[var(--color-ink)]">Sign in</p>
          <p className="text-sm text-[var(--color-ink-muted)]">Use your SID Software Solutions account</p>
        </div>
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        {errors.root ? (
          <p className="text-sm text-[var(--color-status-red)]" role="alert">
            {errors.root.message}
          </p>
        ) : null}
        <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
          Sign in
        </Button>
        <p className="text-sm text-[var(--color-ink-muted)]">
          No account yet?{' '}
          <Link className="text-[var(--color-accent)] underline-offset-2 hover:underline" to="/register">
            Create one
          </Link>
        </p>
      </form>
    </div>
  );
}
