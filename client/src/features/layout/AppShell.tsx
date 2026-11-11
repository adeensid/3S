import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, ListChecks, Settings, Search } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { Button } from '../../components/ui/Button';
import { avatarColorFromId, initialsFromName } from '../../lib/avatar';
import { useCommandPalette } from '../command-palette/CommandPaletteProvider';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex h-9 items-center gap-2 rounded px-3 text-sm transition-colors duration-[var(--motion-fast)] ${
    isActive
      ? 'bg-[var(--color-surface-sunken)] text-[var(--color-ink)]'
      : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)]'
  }`;

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { open } = useCommandPalette();

  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <aside
        className="fixed inset-y-0 left-0 w-[var(--sidebar-width)] border-r border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-4"
        aria-label="Primary"
      >
        <div className="mb-6 px-2">
          <p className="text-base font-semibold text-[var(--color-ink)]">SID</p>
          <p className="text-xs text-[var(--color-ink-muted)]">Software Solutions</p>
        </div>
        <nav className="space-y-1">
          <NavLink to="/" className={navLinkClass} end>
            <ListChecks size={16} strokeWidth={1.5} aria-hidden />
            My issues
          </NavLink>
          <NavLink to="/projects" className={navLinkClass}>
            <FolderKanban size={16} strokeWidth={1.5} aria-hidden />
            Projects
          </NavLink>
          <NavLink to="/dashboard" className={navLinkClass}>
            <LayoutDashboard size={16} strokeWidth={1.5} aria-hidden />
            Dashboard
          </NavLink>
          <NavLink to="/settings" className={navLinkClass}>
            <Settings size={16} strokeWidth={1.5} aria-hidden />
            Settings
          </NavLink>
        </nav>
      </aside>

      <div className="ml-[var(--sidebar-width)] flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-12 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg)] px-4">
          <button
            type="button"
            className="inline-flex h-8 flex-1 max-w-md items-center gap-2 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-sm text-[var(--color-ink-muted)]"
            onClick={open}
            aria-label="Open command palette"
          >
            <Search size={16} strokeWidth={1.5} aria-hidden />
            Search
            <span className="ml-auto text-xs font-mono">Ctrl K</span>
          </button>
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: avatarColorFromId(user.id) }}
              aria-label={user.name}
            >
              {initialsFromName(user.name)}
            </div>
            <Button
              variant="ghost"
              className="h-8"
              onClick={() => {
                void logout().then(() => navigate('/login'));
              }}
            >
              Sign out
            </Button>
          </div>
        </header>
        <main className="flex-1 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
