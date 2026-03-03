import { app, BrowserWindow, dialog } from 'electron';
import path from 'path';
import { registerIpcHandlers } from './ipc';

if (!process.listeners('uncaughtException').some((fn) => fn.name === '__chairPulseUncaught')) {
  process.on('uncaughtException', function __chairPulseUncaught(error) {
    console.error('Uncaught Exception:', error);
    dialog.showErrorBox('Unexpected Error', error.message ?? String(error));
  });
}
if (!process.listeners('unhandledRejection').some((fn) => fn.name === '__chairPulseUnhandled')) {
  process.on('unhandledRejection', function __chairPulseUnhandled(reason, promise) {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
}

const isDev = !!process.env.VITE_DEV_SERVER_URL;

if (isDev) {
  process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
}

const PRODUCTION_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https://api.anthropic.com https://api.openai.com http://localhost:11434",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Chair Pulse',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL!);
    win.webContents.openDevTools();
  } else {
    win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [PRODUCTION_CSP],
        },
      });
    });

    win.webContents.setWindowOpenHandler(() => {
      return { action: 'deny' };
    });

    win.webContents.on('will-navigate', (event) => {
      event.preventDefault();
    });

    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
