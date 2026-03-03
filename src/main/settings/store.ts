import { app } from 'electron';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';

export interface AppSettings {
  aiProvider: 'claude' | 'openai' | 'ollama' | 'none';
  aiModel: string;
  aiBaseUrl: string;
  aiEnabled: boolean;
  recentFiles: string[];
  disclaimerAccepted: boolean;
}

const DEFAULTS: AppSettings = {
  aiProvider: 'none',
  aiModel: '',
  aiBaseUrl: '',
  aiEnabled: false,
  recentFiles: [],
  disclaimerAccepted: false,
};

let cached: AppSettings | null = null;

function getSettingsPath(): string {
  return path.join(app.getPath('userData'), 'settings.json');
}

export function loadSettings(): AppSettings {
  if (cached) return cached;

  try {
    const raw = readFileSync(getSettingsPath(), 'utf-8');
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    cached = { ...DEFAULTS, ...parsed };
  } catch {
    cached = { ...DEFAULTS };
  }

  return cached;
}

function saveSettings(settings: AppSettings): void {
  const dir = path.dirname(getSettingsPath());
  mkdirSync(dir, { recursive: true });
  writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2), 'utf-8');
  cached = settings;
}

function validateSettings(partial: Partial<AppSettings>): Partial<AppSettings> {
  const validated = { ...partial };

  const validProviders = ['none', 'claude', 'openai', 'ollama'];
  if ('aiProvider' in validated && !validProviders.includes(validated.aiProvider as string)) {
    delete validated.aiProvider;
  }

  if ('aiModel' in validated && typeof validated.aiModel !== 'string') {
    delete validated.aiModel;
  }

  if ('aiBaseUrl' in validated && typeof validated.aiBaseUrl !== 'string') {
    delete validated.aiBaseUrl;
  }

  if ('aiEnabled' in validated && typeof validated.aiEnabled !== 'boolean') {
    delete validated.aiEnabled;
  }

  if ('disclaimerAccepted' in validated && typeof validated.disclaimerAccepted !== 'boolean') {
    delete validated.disclaimerAccepted;
  }

  if ('recentFiles' in validated && !Array.isArray(validated.recentFiles)) {
    delete validated.recentFiles;
  }

  return validated;
}

export function updateSettings(partial: Partial<AppSettings>): AppSettings {
  const current = loadSettings();
  const validated = validateSettings(partial);
  const updated = { ...current, ...validated };
  saveSettings(updated);
  return updated;
}
