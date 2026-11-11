import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiRequest } from '../lib/api';
import { getAccessToken } from '../lib/auth-store';
import { useProjects } from '../features/tickets/queries';
import { Skeleton } from '../components/ui/Skeleton';

interface DashboardStats {
  openVsClosedByWeek: Array<{ week: string; open: number; closed: number }>;
  openBugsBySeverity: Array<{ severity: string; count: number }>;
  openTicketsPerAssignee: Array<{ assigneeId: string | null; count: number }>;
  medianHoursToClose: number | null;
  overdueCount: number;
}

export function DashboardPage() {
  const projects = useProjects();
  const projectId = projects.data?.[0]?.id;

  const statsQuery = useQuery({
    queryKey: ['dashboard', projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const response = await apiRequest<{ stats: DashboardStats }>(
        `/api/projects/${projectId}/dashboard`,
        { token: getAccessToken() },
      );
      return response.stats;
    },
  });

  if (projects.isLoading || statsQuery.isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!projectId || !statsQuery.data) {
    return <p className="text-sm text-[var(--color-ink-muted)]">No dashboard data yet.</p>;
  }

  const stats = statsQuery.data;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-lg">Dashboard</h1>
        <p className="text-sm text-[var(--color-ink-muted)]">
          Overdue tickets: <span className="font-mono tabular-nums">{stats.overdueCount}</span>
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <ChartPanel className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-4" title="Open vs closed by week">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.openVsClosedByWeek}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="open" fill="var(--color-status-amber)" name="Open" />
              <Bar dataKey="closed" fill="var(--color-status-green)" name="Closed" />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-4" title="Open bugs by severity">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.openBugsBySeverity}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="severity" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--color-status-red)" name="Bugs" />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </section>

      <section className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm">
        <p className="text-[var(--color-ink-muted)]">Median hours to close</p>
        <p className="font-mono text-xl tabular-nums">
          {stats.medianHoursToClose ? stats.medianHoursToClose.toFixed(1) : '—'}
        </p>
      </section>
    </div>
  );
}

function ChartPanel({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title: string;
}) {
  return (
    <section className={className} aria-label={title}>
      <h2 className="mb-3 text-sm text-[var(--color-ink)]">{title}</h2>
      {children}
    </section>
  );
}
