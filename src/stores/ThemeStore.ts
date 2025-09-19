import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Light/dark mode
export type Theme = 'light' | 'dark';

// Accent color theme
export type Accent = 'pink' | 'blue' | 'green' | 'purple' | 'orange' | 'gray';

// High-level palette presets for unified look & feel across the app
export type Palette = 'dark' | 'gray' | 'light' | 'pink';

interface ThemeState {
  theme: Theme;
  accent: Accent;
  palette: Palette;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setAccent: (accent: Accent) => void;
  setPalette: (palette: Palette) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // Defaults: dark palette
      theme: 'dark',
      accent: 'blue',
      palette: 'dark',
      setTheme: (theme: Theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
      setAccent: (accent: Accent) => set({ accent }),
      setPalette: (palette: Palette) => {
        // Map presets to (theme, accent)
        switch (palette) {
          case 'dark':
            set({ palette, theme: 'dark', accent: 'blue' });
            break;
          case 'gray':
            set({ palette, theme: 'light', accent: 'gray' });
            break;
          case 'light':
            set({ palette, theme: 'light', accent: 'blue' });
            break;
          case 'pink':
            set({ palette, theme: 'light', accent: 'pink' });
            break;
          default:
            set({ palette });
        }
      },
    }),
    {
      name: 'theme-storage',
    }
  )
);
