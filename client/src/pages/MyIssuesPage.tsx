import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthProvider';
import { useProjects, useTickets } from '../features/tickets/queries';
import { Skeleton } from '../components/ui/Skeleton';
import { StatusBadge } from '../components/ui/StatusBadge';

export function MyIssuesPage() {
  const { user } = useAuth();
  const projectsQuery = useProjects();
  const firstProjectId = projectsQuery.data?.[0]?.id;
  const [filters, setFilters] = useState<Record<string, string>>({});
  const ticketsQuery = useTickets(firstProjectId, filters);

  const myTickets = useMemo(() => {
    if (!user || !ticketsQuery.data) return [];
    return ticketsQuery.data.items.filter((ticket) => ticket.assigneeId === user.id);
  }, [ticketsQuery.data, user]);

  if (projectsQuery.isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (!firstProjectId) {
    return (
      <div className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-sm">
        <p>No projects yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-[var(--color-ink-muted)]">Status</span>
          <select
            className="h-9 rounded border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2 text-sm"
            value={filters.status ?? ''}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                status: event.target.value,
              }))
            }
          >
            <option value="">All</option>
            <option value="backlog">Backlog</option>
            <option value="in_progress">In progress</option>
            <option value="in_review">In review</option>
            <option value="done">Done</option>
          </select>
        </label>
        {Object.keys(filters).some((key) => filters[key]) ? (
          <button
            type="button"
            className="text-sm text-[var(--color-accent)] underline-offset-2 hover:underline"
            onClick={() => setFilters({})}
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {ticketsQuery.isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : myTickets.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-muted)]">
          No tickets match these filters.{' '}
          <button type="button" className="text-[var(--color-accent)] underline-offset-2 hover:underline" onClick={() => setFilters({})}>
            Clear filters
          </button>
        </p>
      ) : (
        <ul className="divide-y rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
          {myTickets.map((ticket) => (
            <li key={ticket.id} className="flex h-[var(--row-height)] items-center gap-3 px-3 text-sm">
              <span className="w-20 font-mono text-xs text-[var(--color-ink-muted)]">{ticket.displayKey}</span>
              <Link className="flex-1 truncate hover:underline" to={`/projects/${ticket.projectId}/tickets/${ticket.id}`}>
                {ticket.title}
              </Link>
              <StatusBadge status={ticket.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
