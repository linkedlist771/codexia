import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Provider = "openai" | "google" | "ollama" | "openrouter";

type ProviderConfig = {
  apiKey: string;
  baseUrl: string;
  models: string[];
};

type Providers = Record<Provider, ProviderConfig>;

interface SettingsStore {
  excludeFolders: string[];
  addExcludeFolder: (folder: string) => void;
  removeExcludeFolder: (folder: string) => void;
  setExcludeFolders: (folders: string[]) => void;
  providers: Providers;
  setProviderApiKey: (provider: Provider, key: string) => void;
  setProviderBaseUrl: (provider: Provider, url: string) => void;
  setProviderModels: (provider: Provider, models: string[]) => void;
  defaultProvider: Provider;
  setDefaultProvider: (provider: Provider) => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
  logoSettings: {
    useCustomLogo: boolean;
    customLogoPath: string;
  };
  setUseCustomLogo: (use: boolean) => void;
  setCustomLogoPath: (path: string) => void;
}

const DEFAULT_EXCLUDE_FOLDERS = [
  ".git",
  "node_modules",
  ".venv",
  "__pycache__",
  ".next",
  ".nuxt",
  "dist",
  "build",
  ".DS_Store",
  "target",
  ".cargo",
];

const DEFAULT_PROVIDERS: Providers = {
  openai: {
    apiKey: "",
    baseUrl: "",
    models: ["gpt-5", "gpt-5-mini", "gpt-5-nano", "gpt-4o", "gpt-4o-mini"],
  },
  ollama: {
    apiKey: "",
    baseUrl: "http://localhost:11434/v1",
    models: ["gpt-oss:20b", "gpt-oss:120b", "mistral", "qwen3", "deepseek-r1", "llama3.2", "gemma3"],
  },
  google: {
    apiKey: "",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    models: ["gemini-2.5-flash", "gemini-2.5-pro"],
  },
  openrouter: {
    apiKey: "",
    baseUrl: "https://openrouter.ai/api/v1",
    models: [
      "anthropic/claude-opus-4.1",
      "anthropic/claude-opus-4",
      "anthropic/claude-sonnet-4",
      "anthropic/claude-3.5-sonnet",
      "openai/gpt-oss-20b:free",
      "qwen/qwen3-coder:free",
      "moonshotai/kimi-k2:free"
    ],
  },
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      excludeFolders: DEFAULT_EXCLUDE_FOLDERS,
      providers: { ...DEFAULT_PROVIDERS },
      defaultProvider: "openai",
      activeSection: "provider",
      logoSettings: {
        useCustomLogo: false,
        customLogoPath: "",
      },
      addExcludeFolder: (folder: string) =>
        set((state) => ({
          excludeFolders: [...state.excludeFolders, folder],
        })),
      removeExcludeFolder: (folder: string) =>
        set((state) => ({
          excludeFolders: state.excludeFolders.filter((f) => f !== folder),
        })),
      setExcludeFolders: (folders: string[]) =>
        set({ excludeFolders: folders }),
      setProviderApiKey: (provider: Provider, key: string) =>
        set((state) => ({
          providers: {
            ...state.providers,
            [provider]: { ...state.providers[provider], apiKey: key },
          },
        })),
      setProviderBaseUrl: (provider: Provider, url: string) =>
        set((state) => ({
          providers: {
            ...state.providers,
            [provider]: { ...state.providers[provider], baseUrl: url },
          },
        })),
      setProviderModels: (provider: Provider, models: string[]) =>
        set((state) => ({
          providers: {
            ...state.providers,
            [provider]: { ...state.providers[provider], models },
          },
        })),
      setDefaultProvider: (provider: Provider) =>
        set({ defaultProvider: provider }),
      setActiveSection: (section: string) =>
        set({ activeSection: section }),
      setUseCustomLogo: (use: boolean) =>
        set((state) => ({
          logoSettings: { ...state.logoSettings, useCustomLogo: use },
        })),
      setCustomLogoPath: (path: string) =>
        set((state) => ({
          logoSettings: { ...state.logoSettings, customLogoPath: path },
        })),
    }),
    {
      name: "settings-storage",
    },
  ),
);
