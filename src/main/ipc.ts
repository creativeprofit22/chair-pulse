import { ipcMain, app, dialog, BrowserWindow } from 'electron';
import type { IpcMainInvokeEvent } from 'electron';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { Worker } from 'worker_threads';
import { loadSettings, updateSettings, type AppSettings } from './settings/store';
import { setApiKey, hasApiKey, getApiKey } from './settings/secure-store';
import { ClaudeProvider } from '../core/ai/providers/claude';
import { OpenAIProvider } from '../core/ai/providers/openai';
import { OllamaProvider } from '../core/ai/providers/ollama';
import { generateInsights } from '../core/ai/advisor';
import { generatePdfReport } from '../core/export/pdf-report';
import { generateCsvExport } from '../core/export/csv-export';
import type { FullAnalysisReport } from '../core/types/analysis';
import type { AIInsightsReport, AIProvider } from '../core/types/ai';

/** Only these providers may store API keys. Blocks prototype pollution via arbitrary keys. */
const VALID_API_KEY_PROVIDERS = new Set(['claude', 'openai', 'ollama']);

function createProvider(
  provider: string,
  apiKey: string,
  model?: string,
  baseUrl?: string,
): AIProvider {
  const options = { apiKey, model, baseUrl };
  switch (provider) {
    case 'claude':
      return new ClaudeProvider(options);
    case 'openai':
      return new OpenAIProvider(options);
    case 'ollama':
      return new OllamaProvider(options);
    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

function validateOllamaUrl(baseUrl: string): void {
  if (!baseUrl) return;
  try {
    const url = new URL(baseUrl);
    if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
      throw new Error('Ollama base URL must point to localhost for security');
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('localhost')) throw err;
    throw new Error('Invalid Ollama base URL');
  }
}

export function registerIpcHandlers(): void {
  // ── App Info ────────────────────────────────────────────────────────

  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  // ── File Operations ─────────────────────────────────────────────────

  ipcMain.handle('file:open', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Import Booking CSV',
      filters: [{ name: 'CSV Files', extensions: ['csv'] }],
      properties: ['openFile'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  ipcMain.handle('file:read', (_event: IpcMainInvokeEvent, filePath: string) => {
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('Invalid file path');
    }
    return readFileSync(filePath, 'utf-8');
  });

  // ── Settings ────────────────────────────────────────────────────────

  ipcMain.handle('settings:load', () => {
    return loadSettings();
  });

  ipcMain.handle('settings:save', (_event: IpcMainInvokeEvent, partial: Partial<AppSettings>) => {
    return updateSettings(partial);
  });

  ipcMain.handle(
    'settings:set-api-key',
    (_event: IpcMainInvokeEvent, provider: string, apiKey: string) => {
      if (!VALID_API_KEY_PROVIDERS.has(provider)) {
        throw new Error(`Unknown API key provider: ${provider}`);
      }
      setApiKey(provider, apiKey);
    },
  );

  ipcMain.handle('settings:has-api-key', (_event: IpcMainInvokeEvent, provider: string) => {
    if (!VALID_API_KEY_PROVIDERS.has(provider)) return false;
    return hasApiKey(provider);
  });

  // ── Analysis ──────────────────────────────────────────────────────────

  ipcMain.handle('analysis:run', async (event: IpcMainInvokeEvent, rows: unknown[]) => {
    return new Promise((resolve, reject) => {
      const workerPath = path.join(__dirname, 'analysis-worker.js');
      const worker = new Worker(workerPath);

      worker.on(
        'message',
        (msg: { type: string; progress?: number; data?: unknown; error?: string }) => {
          if (msg.type === 'progress') {
            const win = BrowserWindow.fromWebContents(event.sender);
            if (win) {
              event.sender.send('analysis:progress', msg.progress);
            }
          } else if (msg.type === 'result') {
            resolve(msg.data);
            worker.terminate();
          } else if (msg.type === 'error') {
            reject(new Error(msg.error ?? 'Analysis worker error'));
            worker.terminate();
          }
        },
      );

      worker.on('error', (err) => {
        reject(err);
        worker.terminate();
      });

      worker.postMessage({ type: 'run', rows });
    });
  });

  // ── AI ────────────────────────────────────────────────────────────────

  ipcMain.handle(
    'ai:test-connection',
    async (_event: IpcMainInvokeEvent, providerName: string, model: string, baseUrl: string) => {
      if (!VALID_API_KEY_PROVIDERS.has(providerName)) {
        return { ok: false, error: 'Unknown provider' };
      }

      if (providerName === 'ollama') {
        validateOllamaUrl(baseUrl);
      }

      const apiKey = getApiKey(providerName);
      if (!apiKey && providerName !== 'ollama') {
        return { ok: false, error: 'No API key configured for this provider' };
      }

      const provider = createProvider(providerName, apiKey, model, baseUrl);
      return provider.testConnection();
    },
  );

  ipcMain.handle(
    'ai:generate-insights',
    async (_event: IpcMainInvokeEvent, report: FullAnalysisReport) => {
      const settings = loadSettings();
      if (settings.aiProvider === 'none' || !settings.aiEnabled) {
        throw new Error('AI is not configured. Set up a provider in Settings.');
      }

      if (settings.aiProvider === 'ollama') {
        validateOllamaUrl(settings.aiBaseUrl);
      }

      const apiKey = getApiKey(settings.aiProvider);
      if (!apiKey && settings.aiProvider !== 'ollama') {
        throw new Error('No API key configured. Add your key in Settings.');
      }

      const provider = createProvider(
        settings.aiProvider,
        apiKey,
        settings.aiModel,
        settings.aiBaseUrl,
      );

      return generateInsights(provider, report);
    },
  );

  // ── Export ────────────────────────────────────────────────────────────

  ipcMain.handle(
    'export:save-pdf',
    async (
      _event: IpcMainInvokeEvent,
      report: FullAnalysisReport,
      insights: AIInsightsReport | null,
    ) => {
      const result = await dialog.showSaveDialog({
        title: 'Export PDF Report',
        defaultPath: `chair-pulse-report-${new Date().toISOString().slice(0, 10)}.pdf`,
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
      });

      if (result.canceled || !result.filePath) return false;

      const pdfData = generatePdfReport(report, insights ?? undefined);
      writeFileSync(result.filePath, Buffer.from(pdfData));
      return true;
    },
  );

  ipcMain.handle(
    'export:save-csv',
    async (
      _event: IpcMainInvokeEvent,
      report: FullAnalysisReport,
      insights: AIInsightsReport | null,
    ) => {
      const result = await dialog.showSaveDialog({
        title: 'Export CSV Report',
        defaultPath: `chair-pulse-report-${new Date().toISOString().slice(0, 10)}.csv`,
        filters: [{ name: 'CSV Files', extensions: ['csv'] }],
      });

      if (result.canceled || !result.filePath) return false;

      const csvData = generateCsvExport(report, insights ?? undefined);
      writeFileSync(result.filePath, csvData, 'utf-8');
      return true;
    },
  );
}
