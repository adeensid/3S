import { getThemePreference, setThemePreference, type ThemePreference } from '../lib/theme';

export function SettingsPage() {
  const current = getThemePreference();

  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-lg">Settings</h1>
      <label className="block text-sm">
        <span className="mb-1 block text-[var(--color-ink-muted)]">Theme</span>
        <select
          className="h-9 w-full rounded border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2"
          value={current}
          onChange={(event) => setThemePreference(event.target.value as ThemePreference)}
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
      <p className="text-sm text-[var(--color-ink-muted)]">
        Density toggle and keyboard shortcut reference are available from the board view.
      </p>
    </div>
  );
}
