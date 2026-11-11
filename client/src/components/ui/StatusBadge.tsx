import type { TicketStatus } from '../../lib/types';
import { STATUS_LABELS } from '../../lib/types';

const statusColors: Record<TicketStatus, string> = {
  backlog: 'text-[var(--color-status-gray)]',
  in_progress: 'text-[var(--color-status-amber)]',
  in_review: 'text-[var(--color-ink)]',
  done: 'text-[var(--color-status-green)]',
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={`text-xs ${statusColors[status]}`} aria-label={`Status ${STATUS_LABELS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
