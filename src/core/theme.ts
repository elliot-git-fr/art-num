export type Theme = 'dark' | 'light';
export const THEME_STORAGE_KEY = 'gas-theme';

export interface ThemeEnvironment {
  storage: Pick<Storage, 'getItem' | 'setItem'>;
  prefersDark: () => boolean;
}

export function initialTheme(environment: ThemeEnvironment): Theme {
  const stored = environment.storage.getItem(THEME_STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return environment.prefersDark() ? 'dark' : 'light';
}

export function applyTheme(theme: Theme, root: Pick<HTMLElement, 'dataset'>, storage: Pick<Storage, 'setItem'>): void {
  root.dataset.theme = theme;
  storage.setItem(THEME_STORAGE_KEY, theme);
}

export function oppositeTheme(theme: Theme): Theme { return theme === 'dark' ? 'light' : 'dark'; }
