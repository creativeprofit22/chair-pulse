import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  versions: {
    electron: process.versions.electron,
    node: process.versions.node,
    chrome: process.versions.chrome,
  },

  // ── File Operations ──
  openFile: () => ipcRenderer.invoke('file:open'),
  readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),

  // ── Settings ──
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  saveSettings: (partial: unknown) => ipcRenderer.invoke('settings:save', partial),
  setApiKey: (provider: string, apiKey: string) =>
    ipcRenderer.invoke('settings:set-api-key', provider, apiKey),
  hasApiKey: (provider: string) => ipcRenderer.invoke('settings:has-api-key', provider),

  // ── Analysis ──
  runAnalysis: (rows: unknown[]) => ipcRenderer.invoke('analysis:run', rows),
  onAnalysisProgress: (callback: (progress: number) => void) => {
    const handler = (_event: unknown, progress: number) => callback(progress);
    ipcRenderer.on('analysis:progress', handler);
    return () => {
      ipcRenderer.removeListener('analysis:progress', handler);
    };
  },

  // ── AI ──
  testAIConnection: (provider: string, model: string, baseUrl: string) =>
    ipcRenderer.invoke('ai:test-connection', provider, model, baseUrl),
  generateInsights: (report: unknown) => ipcRenderer.invoke('ai:generate-insights', report),

  // ── Export ──
  exportPdf: (report: unknown, insights: unknown) =>
    ipcRenderer.invoke('export:save-pdf', report, insights),
  exportCsv: (report: unknown, insights: unknown) =>
    ipcRenderer.invoke('export:save-csv', report, insights),
});
