import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ApiError } from '../../lib/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from './AuthProvider';

const schema = z.object({
  name: z.string().trim().min(1),
  email: z.string().email(),
  password: z
    .string()
    .min(10)
    .regex(/[A-Za-z]/)
    .regex(/[0-9]/),
});

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const { register: registerUser, user } = useAuth();
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
            await registerUser(values.name, values.email, values.password);
            navigate('/');
          } catch (error) {
            const message =
              error instanceof ApiError
                ? error.message
                : 'Could not create account. Check your connection and try again.';
            setError('root', { message });
          }
        })}
      >
        <div>
          <p className="text-lg font-semibold text-[var(--color-ink)]">Create account</p>
          <p className="text-sm text-[var(--color-ink-muted)]">Join your team workspace</p>
        </div>
        <Input label="Name" autoComplete="name" error={errors.name?.message} {...register('name')} />
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        {errors.root ? (
          <p className="text-sm text-[var(--color-status-red)]" role="alert">
            {errors.root.message}
          </p>
        ) : null}
        <Button type="submit" variant="primary" className="w-full" disabled={isSubmitting}>
          Create account
        </Button>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Already have an account?{' '}
          <Link className="text-[var(--color-accent)] underline-offset-2 hover:underline" to="/login">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
