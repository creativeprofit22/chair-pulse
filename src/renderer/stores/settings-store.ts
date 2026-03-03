import { create } from 'zustand';
import type { AppSettings } from '../../main/settings/store';

interface SettingsState extends AppSettings {
  loaded: boolean;
  load: () => Promise<void>;
  save: (partial: Partial<AppSettings>) => Promise<void>;
}

const DEFAULTS: AppSettings = {
  aiProvider: 'none',
  aiModel: '',
  aiBaseUrl: '',
  aiEnabled: false,
  recentFiles: [],
  disclaimerAccepted: false,
};

export const useSettingsStore = create<SettingsState>((set) => ({
  ...DEFAULTS,
  loaded: false,

  load: async () => {
    const settings = await window.electronAPI.loadSettings();
    set({ ...settings, loaded: true });
  },

  save: async (partial) => {
    const updated = await window.electronAPI.saveSettings(partial);
    set(updated);
  },
}));
