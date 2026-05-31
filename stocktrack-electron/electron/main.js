const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');
const fs   = require('fs');
const os   = require('os');

const APP_URL  = 'https://stocktrack-pro2.pages.dev';
const isDev    = process.argv.includes('--dev');
let   mainWin  = null;

// ── Create main window ────────────────────────────────────────────────────────
function createWindow() {
  mainWin = new BrowserWindow({
    width:  1280,
    height: 820,
    minWidth:  800,
    minHeight: 600,
    title: 'StockTrack Pro',
    autoHideMenuBar: true,          // clean UI, no browser menu bar
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWin.loadURL(APP_URL);

  if (isDev) mainWin.webContents.openDevTools({ mode: 'detach' });

  mainWin.on('closed', () => { mainWin = null; });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (!mainWin) createWindow(); });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ── IPC: get installed printers ───────────────────────────────────────────────
ipcMain.handle('get-printers', async () => {
  try {
    const printers = await mainWin.webContents.getPrintersAsync();
    return printers.map(p => ({
      name:        p.name,
      displayName: p.displayName || p.name,
      isDefault:   p.isDefault,
      status:      p.status,
    }));
  } catch (e) {
    return [];
  }
});

// ── IPC: silent label print ───────────────────────────────────────────────────
ipcMain.handle('print-label', async (event, { html, printerName, pageWidth, pageHeight, isFullPage }) => {
  // Write static label HTML to a temp file (no CDN scripts — barcode already inlined as SVG)
  const tmpPath = path.join(os.tmpdir(), `stp-label-${Date.now()}.html`);
  fs.writeFileSync(tmpPath, html, 'utf8');

  return new Promise((resolve) => {
    // Hidden offscreen window just for printing
    const printWin = new BrowserWindow({
      show: false,
      webPreferences: { contextIsolation: true, nodeIntegration: false },
    });

    printWin.loadFile(tmpPath);

    printWin.webContents.once('did-finish-load', () => {
      // 200ms is enough — the HTML is purely static, no JS execution needed
      setTimeout(() => {
        const opts = {
          silent:          true,
          printBackground: true,
          margins:         { marginType: 'none' },
        };

        // Page size
        if (isFullPage) {
          // Letter / A4 — let the driver decide landscape from label size
          opts.pageSize  = (pageWidth > 210000) ? 'Letter' : 'A4';
          opts.landscape = pageWidth > pageHeight;
        } else {
          // Exact label dimensions in microns (1 in = 25400 µm)
          opts.pageSize = { width: pageWidth, height: pageHeight };
          opts.landscape = false; // dimensions already encode orientation
        }

        // Specific printer (empty string = OS default)
        if (printerName && printerName.trim()) opts.deviceName = printerName;

        printWin.webContents.print(opts, (success, errorType) => {
          printWin.close();
          try { fs.unlinkSync(tmpPath); } catch {}

          if (!success && Notification.isSupported()) {
            new Notification({
              title: 'StockTrack Pro',
              body:  `Print failed: ${errorType || 'unknown error'}`,
            }).show();
          }

          resolve({ success, errorType });
        });
      }, 200);
    });
  });
});
