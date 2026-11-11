import { Link } from 'react-router-dom';
import { useProjects } from '../features/tickets/queries';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../features/auth/AuthProvider';
import { can } from '../lib/permissions';

export function ProjectsPage() {
  const { user } = useAuth();
  const query = useProjects();

  if (query.isLoading) return <Skeleton className="h-40 w-full" />;
  if (query.isError) {
    return (
      <p className="text-sm text-[var(--color-status-red)]" role="alert">
        Could not load projects. Check your connection and try again.
      </p>
    );
  }

  const projects = query.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg text-[var(--color-ink)]">Projects</h1>
        {user && can(user.role, 'project:create') ? (
          <p className="text-sm text-[var(--color-ink-muted)]">Use the API or admin tools to add a project.</p>
        ) : null}
      </div>
      {projects.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-muted)]">No projects yet.</p>
      ) : (
        <ul className="divide-y rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
          {projects.map((project) => (
            <li key={project.id} className="flex h-[var(--row-height)] items-center gap-3 px-3 text-sm">
              <span className="w-14 font-mono text-xs text-[var(--color-ink-muted)]">{project.ticketKeyPrefix}</span>
              <Link className="flex-1 hover:underline" to={`/projects/${project.id}/board`}>
                {project.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
