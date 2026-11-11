const THEME_KEY = 'sid_theme';

export type ThemePreference = 'system' | 'light' | 'dark';

export function getThemePreference(): ThemePreference {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'system';
}

export function setThemePreference(value: ThemePreference): void {
  localStorage.setItem(THEME_KEY, value);
  applyTheme(value);
}

export function applyTheme(preference: ThemePreference): void {
  const root = document.documentElement;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const useDark =
    preference === 'dark' || (preference === 'system' && systemDark);
  root.dataset.theme = useDark ? 'dark' : 'light';
}
