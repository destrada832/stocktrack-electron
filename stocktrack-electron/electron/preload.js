const { contextBridge, ipcRenderer } = require('electron');

// Expose a clean API to the renderer (StockTrack web app).
// window.electronAPI is only present when running inside the desktop app.
contextBridge.exposeInMainWorld('electronAPI', {
  // Flag the web app checks to know it's inside Electron
  isElectron: true,

  // Print a label silently — returns a promise { success, errorType }
  printLabel: (html, options) =>
    ipcRenderer.invoke('print-label', { html, ...options }),

  // Get installed printers — returns array of { name, displayName, isDefault }
  getPrinters: () =>
    ipcRenderer.invoke('get-printers'),
});
