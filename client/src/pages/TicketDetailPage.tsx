import { useParams } from 'react-router-dom';
import { useTicket } from '../features/tickets/queries';
import { Skeleton } from '../components/ui/Skeleton';
import { StatusBadge } from '../components/ui/StatusBadge';

export function TicketDetailPage() {
  const { projectId = '', ticketId = '' } = useParams();
  const ticketQuery = useTicket(projectId, ticketId);

  if (ticketQuery.isLoading) return <Skeleton className="h-48 w-full" />;
  if (ticketQuery.isError || !ticketQuery.data) {
    return <p className="text-sm text-[var(--color-status-red)]">Could not load this ticket.</p>;
  }

  const ticket = ticketQuery.data;

  return (
    <article className="mx-auto max-w-3xl space-y-4">
      <header className="space-y-1">
        <p className="font-mono text-xs text-[var(--color-ink-muted)]">{ticket.displayKey}</p>
        <h1 className="text-xl text-[var(--color-ink)]">{ticket.title}</h1>
        <StatusBadge status={ticket.status} />
      </header>
      <section className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm leading-6">
        <div
          className="prose prose-sm max-w-none text-[var(--color-ink)]"
          dangerouslySetInnerHTML={{ __html: ticket.description || '<p>No description</p>' }}
        />
      </section>
    </article>
  );
}
