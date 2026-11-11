import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Ticket, TicketStatus } from '../../lib/types';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  status: TicketStatus;
  label: string;
  tickets: Ticket[];
}

export function KanbanColumn({ status, label, tickets }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      className={`w-72 shrink-0 rounded border bg-[var(--color-surface-sunken)] p-2 ${
        isOver ? 'border-[var(--color-border-strong)]' : 'border-[var(--color-border)]'
      }`}
      aria-label={`${label} column`}
    >
      <header className="mb-2 flex h-8 items-center justify-between px-1">
        <h2 className="text-xs font-medium tracking-[0.04em] text-[var(--color-ink-muted)] uppercase">
          {label}
        </h2>
        <span className="font-mono text-xs tabular-nums text-[var(--color-ink-muted)]">
          {tickets.length}
        </span>
      </header>
      <SortableContext items={tickets.map((ticket) => ticket.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <KanbanCard ticket={ticket} />
            </li>
          ))}
        </ul>
      </SortableContext>
    </section>
  );
}
