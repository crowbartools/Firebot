#!/usr/bin/env node
/**
 * Minimal Wayland minimize/tray repro for Electron Ozone FATAL:
 *   wayland_toplevel_window.cc — Should not be called with kMinimized state
 *
 * Usage:
 *   electron scripts/wayland-minimize-repro.js            # crash path (default)
 *   electron scripts/wayland-minimize-repro.js --fixed    # restore-before-show
 */
const { app, BrowserWindow } = require("electron");

const useFixed = process.argv.includes("--fixed");

app.whenReady().then(async () => {
    const win = new BrowserWindow({
        width: 640,
        height: 360,
        frame: false,
        show: true,
        backgroundColor: "#1E2023",
        webPreferences: { sandbox: true }
    });

    await win.loadURL(
        "data:text/html,<body style='background:#1E2023;color:#fff;font:16px sans-serif;padding:2rem'>Wayland minimize repro — fixed=" +
            useFixed +
            "</body>"
    );

    console.error(`[repro] platform=${process.platform} ozone-ish session=${process.env.XDG_SESSION_TYPE} fixed=${useFixed}`);

    // Mimic Firebot minimize-to-tray: minimize event → hide while still minimized
    win.minimize();
    await new Promise((r) => setTimeout(r, 400));
    console.error(`[repro] after minimize: isMinimized=${win.isMinimized()} isVisible=${win.isVisible()}`);
    win.hide();
    await new Promise((r) => setTimeout(r, 400));
    console.error(`[repro] after hide: isMinimized=${win.isMinimized()} isVisible=${win.isVisible()}`);

    try {
        if (useFixed) {
            if (win.isMinimized()) {
                win.restore();
            }
            win.show();
            console.error("[repro] FIXED path: restore then show — survived");
        } else {
            win.show();
            console.error("[repro] CRASH path: show while minimized — if you see this, no FATAL");
        }
        await new Promise((r) => setTimeout(r, 500));
        console.error("[repro] OK exit");
        app.exit(0);
    } catch (err) {
        console.error("[repro] JS error", err);
        app.exit(2);
    }
});
