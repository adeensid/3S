import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { KanbanBoard } from '../features/board/KanbanBoard';
import { useProjects, useTickets } from '../features/tickets/queries';
import { Skeleton } from '../components/ui/Skeleton';
import { StatusBadge } from '../components/ui/StatusBadge';

export function ProjectBoardPage() {
  const { projectId = '' } = useParams();
  const projects = useProjects();
  const project = projects.data?.find((item) => item.id === projectId);
  const [view, setView] = useState<'board' | 'table'>('board');
  const [filters, setFilters] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(`sid_filters_${projectId}`);
    return saved ? (JSON.parse(saved) as Record<string, string>) : {};
  });
  const tickets = useTickets(projectId, filters);

  const tableRows = useMemo(() => tickets.data?.items ?? [], [tickets.data]);

  if (tickets.isLoading || projects.isLoading) {
    return <Skeleton className="h-56 w-full" />;
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs text-[var(--color-ink-muted)]">{project?.ticketKeyPrefix}</p>
          <h1 className="text-lg">{project?.name ?? 'Project'}</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className={`h-8 rounded border px-3 text-sm ${view === 'board' ? 'border-[var(--color-accent)]' : 'border-[var(--color-border)]'}`}
            onClick={() => setView('board')}
          >
            Board
          </button>
          <button
            type="button"
            className={`h-8 rounded border px-3 text-sm ${view === 'table' ? 'border-[var(--color-accent)]' : 'border-[var(--color-border)]'}`}
            onClick={() => setView('table')}
          >
            Table
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-3 text-sm">
        <label>
          <span className="mr-2 text-[var(--color-ink-muted)]">Severity</span>
          <select
            className="h-8 rounded border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2"
            value={filters.severity ?? ''}
            onChange={(event) => {
              const next = { ...filters, severity: event.target.value };
              setFilters(next);
              localStorage.setItem(`sid_filters_${projectId}`, JSON.stringify(next));
            }}
          >
            <option value="">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-[var(--color-ink-muted)]">Search</span>
          <input
            className="h-8 w-48 rounded border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2"
            value={filters.q ?? ''}
            onChange={(event) => {
              const next = { ...filters, q: event.target.value };
              setFilters(next);
              localStorage.setItem(`sid_filters_${projectId}`, JSON.stringify(next));
            }}
            placeholder="Title or description"
            aria-label="Search tickets"
          />
        </label>
      </div>

      {view === 'board' ? (
        <KanbanBoard projectId={projectId} tickets={tableRows} />
      ) : (
        <div className="overflow-x-auto rounded border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] text-xs text-[var(--color-ink-muted)]">
              <tr>
                <th className="px-3 py-2 font-medium">Key</th>
                <th className="px-3 py-2 font-medium">Title</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((ticket) => (
                <tr key={ticket.id} className="h-[var(--row-height)] border-b border-[var(--color-border)]">
                  <td className="px-3 font-mono text-xs">{ticket.displayKey}</td>
                  <td className="px-3">
                    <Link className="hover:underline" to={`/projects/${projectId}/tickets/${ticket.id}`}>
                      {ticket.title}
                    </Link>
                  </td>
                  <td className="px-3">
                    <StatusBadge status={ticket.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
