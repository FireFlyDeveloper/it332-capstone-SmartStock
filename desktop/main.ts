import { app, BrowserWindow, shell } from 'electron';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_API_BASE = 'http://localhost:3000';
const FRONTEND_DEV_URL = process.env.SMARTSTOCK_DESKTOP_DEV_URL;
const API_BASE = process.env.SMARTSTOCK_API_BASE ?? DEFAULT_API_BASE;

function resolveFrontendIndex(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'frontend-dist', 'index.html');
  }

  return path.resolve(__dirname, '..', '..', 'frontend', 'dist', 'index.html');
}

async function loadSmartStock(window: BrowserWindow): Promise<void> {
  if (FRONTEND_DEV_URL) {
    await window.loadURL(FRONTEND_DEV_URL);
    return;
  }

  const frontendIndex = resolveFrontendIndex();
  await window.loadURL(pathToFileURL(frontendIndex).toString());
}

function createMainWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'SmartStock',
    backgroundColor: '#0f172a',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      additionalArguments: [
        `--smartstock-api-base=${encodeURIComponent(API_BASE)}`,
        `--smartstock-app-version=${encodeURIComponent(app.getVersion())}`,
      ],
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  void loadSmartStock(mainWindow).catch((error: unknown) => {
    console.error('Failed to load SmartStock desktop shell:', error);
  });

  return mainWindow;
}

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
