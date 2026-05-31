# StockTrack Pro — Desktop App

Silent label printing for Windows. No print dialog. Click Print Label → it prints.

## How it works

The desktop app is a thin shell that loads `https://stocktrack-pro2.pages.dev`.
- Web updates (drag to Cloudflare) appear automatically — no reinstall needed.
- The only reason to rebuild this app is if you change printer settings or the Electron code.
- On mobile / browser: the print dialog still appears (OS limitation — same as BoxHero).

## First-time setup (do once)

```
cd stocktrack-electron
npm install
```

That's it. No extra tools needed.

## Run in dev mode (test before building)

```
npm start
```

Opens StockTrack in the desktop shell. Go to Settings → Label Printer and pick your printer.

## Build the Windows installer

```
npm run dist
```

Output: `dist/StockTrack Pro Setup 1.0.0.exe`

Send this file to anyone who needs it. They double-click → installed, shortcut on desktop.

## Printer setup (inside the app)

1. Open StockTrack desktop app
2. Go to **Settings** → scroll to **Label Printer** section
3. Pick your label printer from the dropdown (all installed Windows printers show here)
4. Done — clicking "Print Label" anywhere in the app now prints silently to that printer

## Updating StockTrack

- Web changes → just drag `index.html` to Cloudflare as usual. Desktop app picks it up automatically.
- Electron changes (this folder) → bump version in package.json, run `npm run dist`, redistribute the new .exe.

## Note on Windows SmartScreen

When distributing to clients without a code-signing certificate, Windows will show
"Windows protected your PC". Click **More info → Run anyway**. This is normal for
unsigned apps. To remove the warning: purchase a code-signing cert (~$100-400/yr)
and configure it in package.json under `win.certificateFile` / `win.certificatePassword`.

## File structure

```
stocktrack-electron/
  package.json          ← project config + build settings
  electron/
    main.js             ← main process (window, IPC, print handler)
    preload.js          ← bridge between Electron and the web app
  build/
    icon.ico            ← add your app icon here (256x256 recommended)
  dist/                 ← generated installer goes here (git-ignored)
```
