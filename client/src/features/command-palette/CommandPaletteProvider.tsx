import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

interface CommandPaletteContextValue {
  open: () => void;
  close: () => void;
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const open = useCallback(() => {
    setVisible(true);
    setQuery('');
  }, []);

  const close = useCallback(() => {
    setVisible(false);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        open();
      }
      if (event.key === 'Escape') {
        close();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  const value = useMemo(() => ({ open, close }), [open, close]);

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      {visible ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 p-4 pt-24">
          <div
            className="w-full max-w-lg rounded-dialog border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-elevated)]"
            role="dialog"
            aria-modal
            aria-label="Command palette"
          >
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="mb-2 h-9 w-full rounded border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 text-sm"
              placeholder="Jump to a page"
              aria-label="Command query"
            />
            <div className="space-y-1">
              {[
                { label: 'My issues', to: '/' },
                { label: 'Projects', to: '/projects' },
                { label: 'Dashboard', to: '/dashboard' },
                { label: 'Settings', to: '/settings' },
              ]
                .filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
                .map((item) => (
                  <Button
                    key={item.to}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      navigate(item.to);
                      close();
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
            </div>
          </div>
        </div>
      ) : null}
    </CommandPaletteContext.Provider>
  );
}

export function useCommandPalette(): CommandPaletteContextValue {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error('CommandPaletteProvider required');
  return ctx;
}
