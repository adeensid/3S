import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Link } from 'react-router-dom';
import type { Ticket } from '../../lib/types';
import { StatusBadge } from '../../components/ui/StatusBadge';

export function KanbanCard({ ticket }: { ticket: Ticket }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ticket.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm"
      {...attributes}
      {...listeners}
    >
      <Link
        to={`/projects/${ticket.projectId}/tickets/${ticket.id}`}
        className="block"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="font-mono text-xs text-[var(--color-ink-muted)]">{ticket.displayKey}</p>
        <p className="mt-1 text-[var(--color-ink)]">{ticket.title}</p>
      </Link>
      <div className="mt-2">
        <StatusBadge status={ticket.status} />
      </div>
    </article>
  );
}
