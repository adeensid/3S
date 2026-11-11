import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useMemo, useState } from 'react';
import type { Ticket, TicketStatus } from '../../lib/types';
import { STATUS_LABELS } from '../../lib/types';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useToast } from '../../components/ui/Toast';
import { ApiError } from '../../lib/api';
import { KanbanColumn } from './KanbanColumn';
import { useUpdateTicketStatus } from '../tickets/queries';

const columns: TicketStatus[] = ['backlog', 'in_progress', 'in_review', 'done'];

interface KanbanBoardProps {
  projectId: string;
  tickets: Ticket[];
}

export function KanbanBoard({ projectId, tickets }: KanbanBoardProps) {
  const { push } = useToast();
  const mutation = useUpdateTicketStatus(projectId);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const grouped = useMemo(() => {
    const map: Record<TicketStatus, Ticket[]> = {
      backlog: [],
      in_progress: [],
      in_review: [],
      done: [],
    };
    for (const ticket of tickets) {
      map[ticket.status].push(ticket);
    }
    return map;
  }, [tickets]);

  const activeTicket = tickets.find((ticket) => ticket.id === activeId) ?? null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const ticketId = String(event.active.id);
    const status = event.over?.id as TicketStatus | undefined;
    if (!status || !columns.includes(status)) return;

    const current = tickets.find((ticket) => ticket.id === ticketId);
    if (!current || current.status === status) return;

    mutation.mutate(
      { ticketId, status },
      {
        onError: (error) => {
          const ticket = current.displayKey;
          const message =
            error instanceof ApiError
              ? `Could not move ${ticket}. ${error.message}`
              : `Could not move ${ticket}. Check your connection and try again.`;
          push(message);
        },
      },
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-2" role="list" aria-label="Kanban board">
        {columns.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            label={STATUS_LABELS[status]}
            tickets={grouped[status]}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTicket ? (
          <article className="w-64 translate-y-0.5 rounded border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-3 text-sm shadow-[var(--shadow-elevated)]">
            <p className="font-mono text-xs text-[var(--color-ink-muted)]">{activeTicket.displayKey}</p>
            <p className="mt-1 text-[var(--color-ink)]">{activeTicket.title}</p>
            <StatusBadge status={activeTicket.status} />
          </article>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
