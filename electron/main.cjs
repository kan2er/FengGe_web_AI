const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let httpServer = null;

function getConfigDir() {
  if (app.isPackaged) {
    return path.dirname(app.getPath('exe'));
  }
  return path.resolve(__dirname, '..');
}

function showConfigHelp(configDir) {
  const examplePath = path.join(configDir, 'config.json.example');
  const configPath = path.join(configDir, 'config.json');

  // Try to copy example template next to the exe
  try {
    const bundledExample = path.join(__dirname, '..', 'config.json.example');
    if (fs.existsSync(bundledExample) && !fs.existsSync(configPath)) {
      fs.copyFileSync(bundledExample, configPath);
    }
  } catch (_) { /* optional */ }

  dialog.showErrorBox(
    'Configuration Required',
    [
      'config.json not found or incomplete.',
      '',
      'A template may have been created at:',
      configPath,
      '',
      'Please edit it with your own API keys, then restart the app.',
      '',
      'Required: DEEPSEEK_API_KEY',
      'Optional: FISH_AUDIO_API_KEY, FISH_AUDIO_VOICE_ID, HTTPS_PROXY',
    ].join('\n')
  );
}

function loadConfig() {
  const configDir = getConfigDir();
  const configPath = path.join(configDir, 'config.json');

  if (!fs.existsSync(configPath)) {
    showConfigHelp(configDir);
    app.quit();
    return null;
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (err) {
    dialog.showErrorBox(
      'Configuration Error',
      `Unable to parse config.json:\n${err.message}\n\nFile: ${configPath}`
    );
    app.quit();
    return null;
  }

  const key = config.DEEPSEEK_API_KEY || '';
  if (!key || key.startsWith('sk-your-deepseek-key')) {
    showConfigHelp(configDir);
    app.quit();
    return null;
  }

  return {
    DEEPSEEK_BASE_URL: config.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    DEEPSEEK_API_KEY: key,
    FISH_AUDIO_API_KEY: config.FISH_AUDIO_API_KEY || '',
    FISH_AUDIO_VOICE_ID: config.FISH_AUDIO_VOICE_ID || '',
    HTTPS_PROXY: config.HTTPS_PROXY || '',
    PORT: parseInt(config.PORT, 10) || 3001,
  };
}

async function startServer(config) {
  // Set env vars before importing — server modules read them at load time
  process.env.NODE_ENV = 'production';
  process.env.DEEPSEEK_BASE_URL = config.DEEPSEEK_BASE_URL;
  process.env.DEEPSEEK_API_KEY = config.DEEPSEEK_API_KEY;
  process.env.FISH_AUDIO_API_KEY = config.FISH_AUDIO_API_KEY;
  process.env.FISH_AUDIO_VOICE_ID = config.FISH_AUDIO_VOICE_ID;
  process.env.HTTPS_PROXY = config.HTTPS_PROXY;

  const serverModule = await import('../server/app.js');
  const expressApp = serverModule.default;

  const preferredPort = config.PORT;

  return new Promise((resolve, reject) => {
    const server = expressApp.listen(preferredPort, () => {
      console.log(`Server started on port ${preferredPort}`);
      resolve({ server, port: preferredPort });
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Try a random available port
        const fallback = expressApp.listen(0, () => {
          const actualPort = fallback.address().port;
          console.log(`Server started on fallback port ${actualPort}`);
          resolve({ server: fallback, port: actualPort });
        });
        fallback.on('error', reject);
      } else {
        reject(err);
      }
    });
  });
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 720,
    minWidth: 360,
    minHeight: 500,
    title: 'FengGe Chat AI',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(`http://localhost:${port}`);
  mainWindow.setMenuBarVisibility(false);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    const config = loadConfig();
    if (!config) return;

    const { server, port } = await startServer(config);
    httpServer = server;

    createWindow(port);
  } catch (err) {
    dialog.showErrorBox(
      'Startup Error',
      `Failed to start the application:\n${err.message}`
    );
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (httpServer) {
    httpServer.close();
  }
  app.quit();
});
