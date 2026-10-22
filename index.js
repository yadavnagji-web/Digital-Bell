const { app, BrowserWindow, Tray, Menu, powerSaveBlocker, dialog, shell } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const { exec } = require('child_process');

const os = require('os');

// Essential switches for Windows 7 SP1 (32/64-bit) / 8 / 8.1 / 10 / 11 compatibility:
// Ensure audio autoplay is never blocked, background timers never throttled on Win 7 DWM
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('disable-gpu-process-crash-limit');

// Prevent dark/black screen on Windows 7 SP1 GPU rendering
if (process.platform === 'win32' && os.release().startsWith('6.1')) {
  app.disableHardwareAcceleration();
}

const APP_VERSION = '1.0.0';
const APP_NAME = 'Digital Bell';

let mainWindow = null;
let tray = null;
let serverInstance = null;
let isQuitting = false;

// Determine Paths & Initialize AppData Directories (Requirement 10 & 11)
const USER_DATA_DIR = app.getPath('userData'); // %APPDATA%/Digital Bell
const LOGS_DIR = path.join(USER_DATA_DIR, 'logs');
const SETTINGS_DIR = path.join(USER_DATA_DIR, 'settings');
const LOG_FILE = path.join(LOGS_DIR, 'digital_bell.log');
const SETTINGS_FILE = path.join(SETTINGS_DIR, 'settings.json');

function ensureDirectories() {
  try {
    if (!fs.existsSync(USER_DATA_DIR)) fs.mkdirSync(USER_DATA_DIR, { recursive: true });
    if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });
    if (!fs.existsSync(SETTINGS_DIR)) fs.mkdirSync(SETTINGS_DIR, { recursive: true });
  } catch (err) {
    console.error('Directory creation error:', err);
  }
}
ensureDirectories();

// Production Logging System (Requirement 13)
function log(level, message, meta = null) {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
  const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}\n`;
  try {
    fs.appendFileSync(LOG_FILE, logLine, 'utf-8');
  } catch (e) {}
  console.log(`[${level.toUpperCase()}] ${message}`);
}

log('info', `=== ${APP_NAME} v${APP_VERSION} Starting ===`);
log('info', `AppData Directory: ${USER_DATA_DIR}`);

// Master Default Bell Schedules (Requirement 1 & 2)
const DEFAULT_SUMMER_BELLS = [
  { time: "07:15", label: "प्रथम सूचना घंटी", count: 1, ringCount: 1 },
  { time: "07:30", label: "द्वितीय सूचना घंटी", count: 2, ringCount: 2 },
  { time: "07:55", label: "प्रार्थना सभा समाप्त / प्रथम पीरियड", count: 1, ringCount: 1 },
  { time: "08:30", label: "द्वितीय पीरियड", count: 2, ringCount: 2 },
  { time: "09:05", label: "तृतीय पीरियड", count: 3, ringCount: 3 },
  { time: "09:40", label: "चतुर्थ पीरियड", count: 4, ringCount: 4 },
  { time: "10:15", label: "मध्यान्तर", count: -1, ringCount: -1 },
  { time: "10:40", label: "पंचम पीरियड", count: 5, ringCount: 5 },
  { time: "11:15", label: "षष्ठम पीरियड", count: 6, ringCount: 6 },
  { time: "11:50", label: "सप्तम पीरियड", count: 7, ringCount: 7 },
  { time: "12:25", label: "अष्टम पीरियड", count: 8, ringCount: 8 },
  { time: "13:00", label: "विद्यालय अवकाश", count: 0, ringCount: 0 }
];

const DEFAULT_WINTER_BELLS = [
  { time: "09:45", label: "प्रथम सूचना घंटी", count: 1, ringCount: 1 },
  { time: "10:00", label: "द्वितीय सूचना घंटी", count: 2, ringCount: 2 },
  { time: "10:25", label: "प्रार्थना सभा समाप्त / प्रथम पीरियड", count: 1, ringCount: 1 },
  { time: "11:05", label: "द्वितीय पीरियड", count: 2, ringCount: 2 },
  { time: "11:45", label: "तृतीय पीरियड", count: 3, ringCount: 3 },
  { time: "12:25", label: "चतुर्थ पीरियड", count: 4, ringCount: 4 },
  { time: "13:05", label: "मध्यान्तर", count: -1, ringCount: -1 },
  { time: "13:30", label: "पंचम पीरियड", count: 5, ringCount: 5 },
  { time: "14:10", label: "षष्ठम पीरियड", count: 6, ringCount: 6 },
  { time: "14:50", label: "सप्तम पीरियड", count: 7, ringCount: 7 },
  { time: "15:25", label: "अष्टम पीरियड", count: 8, ringCount: 8 },
  { time: "16:00", label: "विद्यालय अवकाश", count: 0, ringCount: 0 }
];

function normalizeSchedule(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => {
    const c = typeof item.ringCount === 'number' ? item.ringCount : (typeof item.count === 'number' ? item.count : 1);
    return { ...item, count: c, ringCount: c };
  });
}

// Default Settings Management (Requirement 3 & 4)
const DEFAULT_SETTINGS = {
  version: APP_VERSION,
  schoolName: "राजकीय उच्च माध्यमिक विद्यालय",
  autoStartOnBoot: true,
  startMinimized: true,
  preventSleep: true,
  selectedSeason: "summer", // summer | winter
  summerSchedule: DEFAULT_SUMMER_BELLS,
  winterSchedule: DEFAULT_WINTER_BELLS,
  volume: 1.0,
  soundType: "real_brass",
  designer: {
    name: "नगजी यादव साकोदरा (NAGJI YADAV SAKODARA)",
    address: "V SAKODARA, P CHIKHALI, D DUNGARPUR (RAJ.) 314030",
    phone: "9982151938"
  }
};

function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      const res = { ...DEFAULT_SETTINGS, ...parsed };
      if (res.summerSchedule) res.summerSchedule = normalizeSchedule(res.summerSchedule);
      if (res.winterSchedule) res.winterSchedule = normalizeSchedule(res.winterSchedule);
      return res;
    }
  } catch (e) {
    log('warn', 'Corrupt or unreadable settings file, restoring default settings', e.message);
  }
  saveSettings(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

function saveSettings(settings) {
  try {
    if (settings.summerSchedule) settings.summerSchedule = normalizeSchedule(settings.summerSchedule);
    if (settings.winterSchedule) settings.winterSchedule = normalizeSchedule(settings.winterSchedule);
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
    log('info', 'Settings saved successfully to ' + SETTINGS_FILE);
  } catch (e) {
    log('error', 'Failed to save settings', e.message);
  }
}

let appSettings = loadSettings();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ico': 'image/x-icon'
};

const WEB_ROOT = path.join(__dirname, 'raw_web');

// Internal Self-Contained Server with Resilient Port Handling (Requirement 5, 6, 12)
function startInternalServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      // API Endpoints for Master Settings Persistence (Requirement 3)
      if (req.url === '/api/settings') {
        if (req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify(appSettings));
          return;
        } else if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const newSettings = JSON.parse(body);
              appSettings = { ...appSettings, ...newSettings };
              saveSettings(appSettings);
              log('info', 'Master settings updated via API from frontend');
              res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
              res.end(JSON.stringify({ success: true, settings: appSettings }));
            } catch (err) {
              res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }
      }

      let safePath = decodeURI(req.url.split('?')[0]);
      if (safePath === '/' || safePath === '') {
        safePath = '/index.html';
      }

      let filePath = path.join(WEB_ROOT, safePath);

      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(WEB_ROOT, 'index.html');
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
          log('error', `Error loading asset ${safePath}`, err ? err.message : 'Not a file');
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('File not found');
          return;
        }

        const range = req.headers.range;
        if (range && (ext === '.wav' || ext === '.mp3')) {
          const parts = range.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
          const chunksize = (end - start) + 1;
          const file = fs.createReadStream(filePath, { start, end });
          res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${stats.size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*'
          });
          file.pipe(res);
        } else {
          res.writeHead(200, {
            'Content-Length': stats.size,
            'Content-Type': contentType,
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'no-cache',
            'Access-Control-Allow-Origin': '*'
          });
          fs.createReadStream(filePath).pipe(res);
        }
      });
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      log('info', `Internal HTTP Server running on http://127.0.0.1:${port}`);
      resolve({ server, port });
    });

    server.on('error', (err) => {
      log('error', `HTTP Server failed: ${err.message}`);
      reject(err);
    });
  });
}

// Triple-Redundant Auto-Start on Windows Startup (Registry, Startup Folder & Electron Login Item)
function configureAutoStart(enable) {
  try {
    // 1. Electron setLoginItemSettings
    app.setLoginItemSettings({
      openAtLogin: enable,
      path: process.execPath,
      args: ['--hidden']
    });

    // 2. Windows Registry Run Key (HKCU\Software\Microsoft\Windows\CurrentVersion\Run)
    const regKey = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
    const appExe = `"${process.execPath}" --hidden`;
    if (enable) {
      exec(`reg add "${regKey}" /v "Digital Bell" /t REG_SZ /d "${appExe}" /f`, (err) => {
        if (!err) log('info', 'Windows Registry autostart key added successfully');
      });
    } else {
      exec(`reg delete "${regKey}" /v "Digital Bell" /f`, (err) => {
        if (!err) log('info', 'Windows Registry autostart key removed');
      });
    }

    // 3. Windows Startup Folder Shortcut (.lnk)
    const startupDir = path.join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
    const shortcutPath = path.join(startupDir, 'Digital Bell.lnk');
    if (enable && fs.existsSync(startupDir)) {
      const psScript = `$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('${shortcutPath.replace(/'/g, "''")}'); $s.TargetPath = '${process.execPath.replace(/'/g, "''")}'; $s.Arguments = '--hidden'; $s.WorkingDirectory = '${path.dirname(process.execPath).replace(/'/g, "''")}'; $s.WindowStyle = 7; $s.Save()`;
      exec(`powershell -NoProfile -Command "${psScript}"`, (err) => {
        if (!err) log('info', 'Windows Startup folder shortcut created successfully');
      });
    } else if (!enable && fs.existsSync(shortcutPath)) {
      try { fs.unlinkSync(shortcutPath); } catch (e) {}
    }

    appSettings.autoStartOnBoot = enable;
    saveSettings(appSettings);
    log('info', `Auto-Start configured successfully: ${enable}`);
  } catch (e) {
    log('error', 'Failed to configure auto-start', e.message);
  }
}

// OS Hardware Multi-Strike Audio Player (Requirement 1, 2 & 4)
let isPlayingSystemSound = false;

function playSingleWav(wavFilename) {
  return new Promise((resolve) => {
    const wavPath = path.join(__dirname, 'raw_web', 'assets', wavFilename);
    if (!fs.existsSync(wavPath)) return resolve();
    const escaped = wavPath.replace(/'/g, "''");
    const psCmd = `powershell -NoProfile -Command "$p = New-Object System.Media.SoundPlayer '${escaped}'; $p.PlaySync()"`;
    exec(psCmd, (err) => {
      if (err) log('warn', `PowerShell audio play error: ${err.message}`);
      resolve();
    });
  });
}

async function playBellSound(count, label) {
  if (isPlayingSystemSound) return;
  isPlayingSystemSound = true;
  log('info', `[SOUND ENGINE] Playing system bell: ${label} (Count: ${count})`);
  try {
    const wavLong10 = fs.existsSync(path.join(__dirname, 'raw_web', 'assets', 'chutti_bell.wav'))
      ? 'chutti_bell.wav' : 'madhyantar_bell.wav';
    const wavTan = fs.existsSync(path.join(__dirname, 'raw_web', 'assets', 'school_bell_Tan-D0KlyVNl.wav'))
      ? 'school_bell_Tan-D0KlyVNl.wav' : 'real_brass_gong_tan.wav';

    if (label && label.includes('प्रथम सूचना')) {
      // 1st Warning Bell: 10s Long Bell + 1 Tan Strike
      await playSingleWav(wavLong10);
      await new Promise(r => setTimeout(r, 600));
      await playSingleWav(wavTan);
    } else if (label && label.includes('द्वितीय सूचना')) {
      // 2nd Warning Bell: 10s Long Bell + 2 Tan Strikes
      await playSingleWav(wavLong10);
      await new Promise(r => setTimeout(r, 600));
      await playSingleWav(wavTan);
      await new Promise(r => setTimeout(r, 800));
      await playSingleWav(wavTan);
    } else if (count === 0) {
      // Chutti / Dismissal - 10 seconds
      await playSingleWav(wavLong10);
    } else if (count === -1) {
      // Madhyantar / Recess - 10 seconds
      await playSingleWav(wavLong10);
    } else {
      // Period bell: 1 to 8 strikes
      const strikes = Math.max(1, count || 1);
      for (let i = 0; i < strikes; i++) {
        await playSingleWav(wavTan);
        if (i < strikes - 1) {
          await new Promise(r => setTimeout(r, 500));
        }
      }
    }
  } catch (err) {
    log('error', `playBellSound error: ${err.message}`);
  } finally {
    isPlayingSystemSound = false;
  }
}

let lastRungScheduleKey = "";

// Main Process Continuous Scheduler - Uses Dynamic User-Saved Schedules (Requirement 3 & 4)
function startBackgroundScheduler() {
  setInterval(() => {
    try {
      const now = new Date();
      const currentMonth = now.getMonth(); // 0 = Jan, 9 = Oct
      const defaultSeason = (currentMonth >= 3 && currentMonth <= 8) ? "summer" : "winter";
      const season = appSettings.selectedSeason || defaultSeason;

      const schedule = season === "summer"
        ? (appSettings.summerSchedule && appSettings.summerSchedule.length ? appSettings.summerSchedule : DEFAULT_SUMMER_BELLS)
        : (appSettings.winterSchedule && appSettings.winterSchedule.length ? appSettings.winterSchedule : DEFAULT_WINTER_BELLS);

      const hh = now.getHours().toString().padStart(2, '0');
      const mm = now.getMinutes().toString().padStart(2, '0');
      const timeStr = `${hh}:${mm}`;

      const match = schedule.find(item => item.time === timeStr);
      if (match) {
        const ringKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}_${timeStr}_${match.label}`;
        if (lastRungScheduleKey !== ringKey) {
          lastRungScheduleKey = ringKey;
          log('info', `[MAIN SCHEDULER] Triggering bell: ${match.label} at ${timeStr} (Strikes: ${match.count})`);

          // 1. Notify Renderer UI (if window is open):
          if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.executeJavaScript(`
              if (window.__triggerAutoBell) {
                window.__triggerAutoBell(${match.count}, ${JSON.stringify(match.label)});
              }
            `).catch(() => {});
          }

          // 2. Hardware OS SoundPlayer Fallback:
          // If window is minimized, hidden in tray, or screen locked:
          const isHidden = !mainWindow || !mainWindow.isVisible() || mainWindow.isMinimized();
          if (isHidden) {
            playBellSound(match.count, match.label);
          }
        }
      }
    } catch (e) {
      log('warn', 'Background scheduler tick error:', e.message);
    }
  }, 1000);
}

// System Tray Integration (Requirement 9)
function createTray(appUrl) {
  const trayIconPath = path.join(__dirname, 'build', 'tray.png');
  const icon = fs.existsSync(trayIconPath) ? trayIconPath : path.join(__dirname, 'raw_web', 'assets', 'tray_icon.png');

  tray = new Tray(icon);
  tray.setToolTip(`Digital Bell v${APP_VERSION} - ऑटोमैटिक स्कूल घंटी प्रणाली (नगजी यादव)`);

  const updateContextMenu = () => {
    const isAutoStart = app.getLoginItemSettings().openAtLogin;
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '🔔 Digital Bell खोलें (Open)',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      {
        label: '⚡ तुरंत पीरियड घंटी बजाएं (Ring Period Chime)',
        click: () => {
          if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.executeJavaScript(`
              try {
                const a = new Audio('/assets/school_bell_Tan-D0KlyVNl.wav');
                a.play().catch(console.error);
              } catch(e) {}
            `);
          }
        }
      },
      {
        label: '📢 तुरंत लंबी घंटी बजाएं (Ring Long Bell)',
        click: () => {
          if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.executeJavaScript(`
              try {
                const a = new Audio('/assets/Long-bIIZeSmH.wav');
                a.play().catch(console.error);
              } catch(e) {}
            `);
          }
        }
      },
      { type: 'separator' },
      {
        label: '🚀 Windows शुरू होते ही ऑटो-स्टार्ट',
        type: 'checkbox',
        checked: isAutoStart,
        click: (item) => {
          configureAutoStart(item.checked);
          updateContextMenu();
        }
      },
      {
        label: '📖 उपयोगकर्ता पुस्तिका (User Manual)',
        click: () => {
          const manualWindow = new BrowserWindow({
            width: 950,
            height: 750,
            title: 'उपयोगकर्ता पुस्तिका (User Manual) - Digital Bell',
            autoHideMenuBar: true
          });
          manualWindow.loadURL(`${appUrl}USER_MANUAL_HINDI.html`);
        }
      },
      {
        label: '📂 सेटिंग्स एवं लॉग्स फोल्डर खोलें',
        click: () => {
          shell.openPath(USER_DATA_DIR);
        }
      },
      {
        label: '✨ डिज़ाइनर विवरण (Designer Info)',
        click: () => {
          dialog.showMessageBox({
            type: 'info',
            title: 'सॉफ्टवेयर डिज़ाइनर विवरण',
            message: `Digital Bell - School Bell System v${APP_VERSION}`,
            detail: `डिज़ाइनर: ${appSettings.designer.name}\n` +
                    `पता: ${appSettings.designer.address}\n` +
                    `मोबाइल: ${appSettings.designer.phone}\n\n` +
                    `डेटा स्टोरेज: ${USER_DATA_DIR}`
          });
        }
      },
      { type: 'separator' },
      {
        label: '❌ सॉफ्टवेयर बंद करें (Exit)',
        click: () => {
          log('info', 'App exit requested from tray');
          isQuitting = true;
          app.quit();
        }
      }
    ]);
    tray.setContextMenu(contextMenu);
  };

  updateContextMenu();

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

async function createWindow() {
  try {
    // Prevent Windows Sleep / Suspension (Requirement 9)
    try {
      powerSaveBlocker.start('prevent-app-suspension');
      log('info', 'powerSaveBlocker active: prevent-app-suspension');
    } catch (e) {
      log('warn', 'powerSaveBlocker error', e.message);
    }

    if (appSettings.autoStartOnBoot) {
      configureAutoStart(true);
    }

    const { server, port } = await startInternalServer();
    serverInstance = server;
    const appUrl = `http://127.0.0.1:${port}/`;

    createTray(appUrl);

    const iconPath = path.join(__dirname, 'build', 'icon.ico');
    const startHidden = process.argv.includes('--hidden');

    mainWindow = new BrowserWindow({
      width: 1220,
      height: 760,
      minWidth: 980,
      minHeight: 620,
      center: true,
      show: false, // Prevents dark/black screen flash before content renders
      backgroundColor: '#f0f9ff', // Light sky blue, matching app theme exactly
      title: `Digital Bell v${APP_VERSION} - स्कूल ऑटोमैटिक घंटी प्रणाली`,
      icon: fs.existsSync(iconPath) ? iconPath : undefined,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        backgroundThrottling: false // Continuous timer execution in background
      }
    });

    // Show window only when content is ready to paint, eliminating any dark/blank screen
    mainWindow.once('ready-to-show', () => {
      if (!startHidden) {
        mainWindow.show();
        mainWindow.focus();
      }
    });

    // Clear code and HTTP caches to ensure latest UI updates always appear
    try {
      mainWindow.webContents.session.clearCache();
      mainWindow.webContents.session.clearCodeCaches({});
    } catch(e) {}

    // Relay all renderer console messages to logger
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
      log('info', `[RENDERER] ${message}`);
    });

    log('info', `Loading URL: ${appUrl}`);
    mainWindow.loadURL(appUrl);

    // Start Main Process Continuous Background Scheduler
    startBackgroundScheduler();
    log('info', 'Main process background scheduler started - bells will ring continuously until PC shutdown');

    // Minimize to System Tray on close (Requirement 9)
    mainWindow.on('close', (event) => {
      if (!isQuitting) {
        event.preventDefault();
        mainWindow.hide();
        if (tray && process.platform === 'win32') {
          tray.displayBalloon({
            title: 'Digital Bell सक्रिय है',
            content: 'सॉफ्टवेयर बैकग्राउंड में चालू है और निर्धारित समय पर घंटी बजाता रहेगा।',
            iconType: 'info'
          });
        }
        log('info', 'MainWindow minimized to system tray');
      }
    });

    mainWindow.webContents.on('did-finish-load', () => {
      log('info', 'UI loaded successfully');
      mainWindow.setTitle(`Digital Bell v${APP_VERSION} - स्कूल ऑटोमैटिक घंटी प्रणाली`);
      if (!startHidden && !mainWindow.isVisible()) {
        mainWindow.show();
        mainWindow.focus();
      }
    });

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      log('error', `UI failed to load: ${errorCode} - ${errorDescription}`);
      dialog.showErrorBox(
        'लोडिंग त्रुटि (Loading Error)',
        `Digital Bell UI लोड नहीं हो सका। कृपया सॉफ्टवेयर पुनः शुरू करें।\nत्रुटि विवरण: ${errorDescription}`
      );
    });

  } catch (err) {
    log('error', 'Fatal error during createWindow', err.stack || err.message);
    dialog.showErrorBox(
      'आरंभ त्रुटि (Startup Error)',
      `सॉफ्टवेयर शुरू करने में समस्या आई: ${err.message}\nलॉग फाइल: ${LOG_FILE}`
    );
  }
}

// Single Instance Lock (Requirement 12)
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  log('info', 'Another instance is already running. Focusing existing instance and quitting new one.');
  app.quit();
} else {
  app.on('second-instance', () => {
    log('info', 'Second instance attempted. Showing main window.');
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    log('info', 'Electron app ready');
    createWindow();
  });

  app.on('before-quit', () => {
    log('info', 'Application shutting down cleanly');
    isQuitting = true;
    if (serverInstance) {
      serverInstance.close();
    }
  });

  app.on('window-all-closed', (e) => {
    // Keep app running in background tray even when window is closed
    e.preventDefault();
  });
}
