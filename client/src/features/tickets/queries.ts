import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { getAccessToken } from '../../lib/auth-store';
import type { Project, Ticket, TicketStatus } from '../../lib/types';

function token() {
  return getAccessToken();
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await apiRequest<{ projects: Project[] }>('/api/projects', { token: token() });
      return response.projects;
    },
  });
}

export function useTickets(projectId: string | undefined, filters: Record<string, string>) {
  const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value));
  const search = new URLSearchParams(params).toString();
  return useQuery({
    queryKey: ['tickets', projectId, filters],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const response = await apiRequest<{ items: Ticket[]; nextCursor: string | null }>(
        `/api/projects/${projectId}/tickets?${search}`,
        { token: token() },
      );
      return response;
    },
  });
}

export function useTicket(projectId: string, ticketId: string) {
  return useQuery({
    queryKey: ['ticket', projectId, ticketId],
    queryFn: async () => {
      const response = await apiRequest<{ ticket: Ticket }>(
        `/api/projects/${projectId}/tickets/${ticketId}`,
        { token: token() },
      );
      return response.ticket;
    },
  });
}

export function useUpdateTicketStatus(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: TicketStatus }) => {
      return apiRequest<{ ticket: Ticket }>(`/api/projects/${projectId}/tickets/${ticketId}`, {
        method: 'PATCH',
        token: token(),
        body: { status },
      });
    },
    onMutate: async ({ ticketId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tickets', projectId] });
      const snapshots = queryClient.getQueriesData<{ items: Ticket[] }>({ queryKey: ['tickets', projectId] });
      snapshots.forEach(([key, data]) => {
        if (!data) return;
        queryClient.setQueryData(key, {
          ...data,
          items: data.items.map((ticket) =>
            ticket.id === ticketId ? { ...ticket, status } : ticket,
          ),
        });
      });
      return { snapshots };
    },
    onError: (_error, _vars, context) => {
      context?.snapshots.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['tickets', projectId] });
    },
  });
}
