import { BrowserWindow, Menu, shell, dialog, nativeImage, WebContentsView } from "electron";
import { TypedEmitter } from "tiny-typed-emitter";
import path from "path";
import url from "url";
import { setupTitlebar, attachTitlebarToWindow } from "custom-electron-titlebar/main";
import windowStateKeeper from "electron-window-state";

import logger from "../../logwrapper";
import fileOpenHelpers from "../file-open-helpers";
import createTray from "./tray-creation";
import * as screenHelpers from "./screen-helpers";
import accountAccess from "../../common/account-access";
import argv from "../../common/argv-parser";
import connectionManager from "../../common/connection-manager";
import customVariableManager from "../../common/custom-variable-manager";
import dataAccess from "../../common/data-access";
import frontendCommunicator from "../../common/frontend-communicator";
import profileManager from "../../common/profile-manager";
import { SettingsManager } from "../../common/settings-manager";
import startupScriptsManager from "../../common/handlers/custom-scripts/startup-scripts-manager";
import { BackupManager } from "../../backup-manager";
import eventManager from "../../events/EventManager";
import { createEffectQueueMonitorWindow, getEffectQueueMonitorWindow } from "./windows/effect-queue-monitor-window";

class WindowManager {
    events: TypedEmitter<{
        "main-window-closed": () => void;
    }> = new TypedEmitter();

    /**
     * The main Firebot window.
     */
    mainWindow: BrowserWindow;

    /**
     * The splash screen window.
     */
    private _splashscreenWindow: BrowserWindow;

    /**
     * The variable inspector window.
     */
    private _variableInspectorWindow: BrowserWindow;

    /**
     * The stream preview popout window.
     */
    private _streamPreview: BrowserWindow;

    createStreamPreviewWindow(): void {
        if (this._streamPreview != null && !this._streamPreview.isDestroyed()) {
            if (this._streamPreview.isMinimized()) {
                this._streamPreview.restore();
            }
            this._streamPreview.focus();
            return;
        }

        const streamer = accountAccess.getAccounts().streamer;

        if (!streamer.loggedIn) {
            return;
        }

        const streamPreviewWindowState = windowStateKeeper({
            defaultWidth: 815,
            defaultHeight: 480,
            file: "stream-preview-window-state.json"
        });

        this._streamPreview = new BrowserWindow({
            frame: true,
            alwaysOnTop: true,
            backgroundColor: "#1E2023",
            title: "Stream Preview",
            parent: this.mainWindow,
            width: streamPreviewWindowState.width,
            height: streamPreviewWindowState.height,
            x: streamPreviewWindowState.x,
            y: streamPreviewWindowState.y,
            webPreferences: {},
            icon: path.join(__dirname, "../../../gui/images/logo_transparent_2.png")
        });

        this._streamPreview.setBounds({
            height: streamPreviewWindowState.height || 480,
            width: streamPreviewWindowState.width || 815
        }, false);

        this._streamPreview.setMenu(null);

        const view = new WebContentsView();
        this._streamPreview.contentView.addChildView(view);

        const bounds = this._streamPreview.getBounds();
        view.setBounds({
            x: 0,
            y: 0,
            width: bounds.width,
            height: bounds.height
        });

        this._streamPreview.on("resize", () => {
            if (!this._streamPreview || !view) {
                return;
            }

            const bounds = this._streamPreview.getBounds();
            view.setBounds({
                x: 0,
                y: 0,
                width: bounds.width,
                height: bounds.height
            });
        });

        void view.webContents.loadURL(`https://player.twitch.tv/?channel=${streamer.username}&parent=firebot&muted=true`);

        streamPreviewWindowState.manage(this._streamPreview);

        this._streamPreview.on("close", () => {
            if (!view.webContents.isDestroyed()) {
                // eslint-disable-next-line
                (view.webContents as any).destroy();
            }
        });
    }

    async createIconImage(relativeIconPath: string): Promise<Electron.NativeImage | string> {
        const iconPath = path.resolve(__dirname, relativeIconPath);
        if (process.platform === "darwin") {
            try {
                return await nativeImage.createThumbnailFromPath(iconPath, {
                    width: 14,
                    height: 14
                });
            } catch (e) {
                logger.error(`Failed to create icon image for path: ${relativeIconPath}`, relativeIconPath, e);
                return;
            }
        }
        return await nativeImage.createThumbnailFromPath(iconPath, {
            width: 16,
            height: 16
        });
    }

    async createAppMenu(): Promise<void> {
        const overlayInstances = SettingsManager.getSetting("OverlayInstances");

        const menuTemplate: Electron.MenuItemConstructorOptions[] = [
            {
                label: "File",
                submenu: [
                    {
                        label: "Import Firebot Setup...",
                        click: () => {
                            frontendCommunicator.send("open-modal", {
                                component: "importSetupModal"
                            });
                        },
                        icon: await this.createIconImage("../../../gui/images/icons/mdi/import.png")
                    },
                    {
                        type: "separator"
                    },
                    {
                        label: "Open Data Folder",
                        toolTip: "Open the folder where Firebot data is stored",
                        sublabel: "Open the folder where Firebot data is stored",
                        click: () => {
                            const rootFolder = path.resolve(
                                profileManager.getPathInProfile("/")
                            );
                            void shell.openPath(rootFolder);
                        },
                        icon: await this.createIconImage("../../../gui/images/icons/mdi/folder-account-outline.png")
                    },
                    {
                        label: "Open Logs Folder",
                        toolTip: "Open the folder where logs are stored",
                        sublabel: "Open the folder where logs are stored",
                        click: () => {
                            const rootFolder = path.resolve(
                                dataAccess.getPathInUserData("/logs/")
                            );
                            void shell.openPath(rootFolder);
                        },
                        icon: await this.createIconImage("../../../gui/images/icons/mdi/folder-text-outline.png")
                    },
                    {
                        label: "Open Backups Folder",
                        toolTip: "Open the folder where backups are stored",
                        sublabel: "Open the folder where backups are stored",
                        click: () => {
                            const backupFolder = BackupManager.backupFolderPath;
                            void shell.openPath(backupFolder);
                        },
                        icon: await this.createIconImage("../../../gui/images/icons/mdi/folder-refresh-outline.png")
                    },
                    {
                        type: "separator"
                    },
                    {
                        role: "quit",
                        icon: await this.createIconImage("../../../gui/images/icons/mdi/exit-run.png")
                    }
                ]
            },
            {
                label: "Edit",
                submenu: [
                    {
                        role: "cut",
                        icon: await this.createIconImage("../../../gui/images/icons/mdi/content-cut.png")
                    },
                    {
                        role: "copy",
                        icon: await this.createIconImage("../../../gui/images/icons/mdi/content-copy.png")
                    },
                    {
                        role: "paste",
                        icon: await this.createIconImage("../../../gui/images/icons/mdi/content-paste.png")
                    },
                    {
                        role: "undo",
                        icon: await this.createIconImage("../../../gui/images/icons/mdi/undo.png")
                    },
                    {
                        role: "redo",
                        icon: await this.createIconImage("../../../gui/images/icons/mdi/redo.png")
                    },
                    {
                        role: "selectAll",
                        icon: await this.createIconImage("../../../gui/images/icons/mdi/select-all.png")
                    }
                ]
            },
            {
                label: "Window",
                submenu: [
                    {
                        role: "minimize",
                        icon: await this.createIconImage("../../../gui/images/icons/mdi/window-minimize.png")
                    },
                    {
                        role: "close",
                        icon: await this.createIconImage("../../../gui/images/icons/mdi/window-close.png")
                    }
                ]
            },
            {
                label: "Tools",
                submenu: [
                    {
                        label: "Setup Wizard",
                        toolTip: "Run the setup wizard again",
                        sublabel: "Run the setup wizard again",
                        click: () => {
                            frontendCommunicator.send("open-modal", {
                                component: "setupWizardModal"
                            });
                        },
                        icon: await this.createIconImage("../../../gui/images/icons/mdi/auto-fix.png")
                    },
                    {
                        label: "Restore from backup...",
                        toolTip: "Restores Firebot from a backup",
                        sublabel: "Restores Firebot from a backup",
                        click: () => {
                            frontendCommunicator.send("backups:start-restore-backup");
                        },
                        icon: await this.createIconImage("../../../gui/images/icons/mdi/backup-restore.png")
                    },
                    {
                        label: "Custom Variable Inspector",
                        toolTip: "Open the custom variable inspector",
                        sublabel: "Open the custom variable inspector",
                        click: () => {

                            void this.createVariableInspectorWindow();
                        },
                        icon: await this.createIconImage("../../../gui/images/icons/mdi/text-search.png")
                    },
                    {
                        label: "Effect Queue Monitor",
                        toolTip: "Open the effect queue monitor",
                        sublabel: "Open the effect queue monitor",
                        click: () => {
                            void createEffectQueueMonitorWindow();
                        },
                        icon: await this.createIconImage("../../../gui/images/icons/mdi/queue-first-in-last-out.png")
                    },
                    {
                        label: "Open Overlay In Browser",
                        toolTip: "Open Firebot's overlay in your default browser",
                        sublabel: "Open Firebot's overlay in your default browser",
                        submenu: [
                            {
                                label: "Default",
                                toolTip: "Open Firebot's default overlay in your default browser",
                                sublabel: "Open Firebot's default overlay in your default browser",
                                click: () => {
                                    const port = SettingsManager.getSetting("WebServerPort");
                                    void shell.openExternal(`http://localhost:${port}/overlay`);
                                }
                            },
                            ...overlayInstances.map(instance => ({
                                label: instance,
                                toolTip: `Open Firebot's ${instance} overlay instance in your default browser`,
                                sublabel: `Open Firebot's ${instance} overlay instance in your default browser`,
                                click: () => {
                                    const port = SettingsManager.getSetting("WebServerPort");
                                    void shell.openExternal(`http://localhost:${port}/overlay?instance=${instance}`);
                                }
                            }))
                        ],
                        icon: await this.createIconImage("../../../gui/images/icons/mdi/open-in-app.png")
                    },
                    {
                        type: "separator"
                    },
                    {
                        role: "toggleDevTools",
                        icon: await this.createIconImage("../../../gui/images/icons/mdi/tools.png")
                    }
                ]
            },
            {
                role: "help",
                submenu: [
                    {
                        label: "Join our Discord",
                        click: () => {
                            void shell.openExternal("https://discord.gg/crowbartools-372817064034959370");
                        },
                        icon: await this.createIconImage("../../../gui/images/icons/discord.png")
                    },
                    {
                        label: "Follow @firebot.app on Bluesky",
                        click: () => {
                            void shell.openExternal("https://bsky.app/profile/firebot.app");
                        },
                        icon: await this.createIconImage("../../../gui/images/icons/bluesky.png")
                    },
                    {
                        type: "separator"
                    },
                    {
                        label: "View Source on GitHub",
                        click: () => {
                            void shell.openExternal("https://github.com/crowbartools/Firebot");
                        },
                        icon: await this.createIconImage("../../../gui/images/icons/mdi/source-branch.png")
                    },
                    {
                        label: "Report a Bug",
                        click: () => {
                            void shell.openExternal("https://github.com/crowbartools/Firebot/issues/new?assignees=&template=bug_report.yml");
                        },
                        icon: await this.createIconImage("../../../gui/images/icons/mdi/bug-outline.png")
                    },
                    {
                        label: "Request a Feature",
                        click: () => {
                            void shell.openExternal("https://github.com/crowbartools/Firebot/issues/new?assignees=&template=feature_request.md");
                        },
                        icon: await this.createIconImage("../../../gui/images/icons/mdi/star-circle-outline.png")
                    },
                    {
                        type: "separator"
                    },
                    {
                        label: "Merch Store",
                        click: () => {
                            void shell.openExternal("https://crowbar-tools.myspreadshop.com");
                        },
                        icon: await this.createIconImage("../../../gui/images/icons/mdi/shopping-outline.png")
                    },
                    {
                        label: "Donate",
                        click: () => {
                            void shell.openExternal("https://opencollective.com/crowbartools");
                        },
                        icon: await this.createIconImage("../../../gui/images/icons/mdi/hand-heart-outline.png")
                    },
                    {
                        label: "Submit a Testimonial",
                        click: () => {
                            void shell.openExternal("https://firebot.app/testimonial-submission");
                        },
                        icon: await this.createIconImage("../../../gui/images/icons/mdi/account-heart-outline.png")
                    },
                    {
                        type: "separator"
                    },
                    {
                        label: "About Firebot...",
                        click: () => {
                            frontendCommunicator.send("open-about-modal");
                        },
                        icon: await this.createIconImage("../../../gui/images/icons/mdi/information-outline.png")
                    }
                ]
            }
        ];

        Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
    }

    async createMainWindow() {
        const mainWindowState = windowStateKeeper({
            defaultWidth: 1280,
            defaultHeight: 720
        });

        frontendCommunicator.on("preload.openDevTools", () => {
            if (this.mainWindow != null) {
                this.mainWindow.webContents.openDevTools();
                return true;
            }
            return false;
        });

        const additionalArguments: string[] = [];

        // eslint-disable-next-line
        if (Object.hasOwn(argv, "fbuser-data-directory") && argv["fbuser-data-directory"] != null && argv["fbuser-data-directory"] !== "") {
            // eslint-disable-next-line
            additionalArguments.push(`--fbuser-data-directory=${argv["fbuser-data-directory"]}`);
        }

        // Create the browser window.
        const mainWindow = new BrowserWindow({
            x: mainWindowState.x,
            y: mainWindowState.y,
            width: mainWindowState.width,
            height: mainWindowState.height,
            minWidth: 300,
            minHeight: 50,
            icon: path.join(__dirname, "../../../gui/images/logo_transparent_2.png"),
            show: false,
            titleBarStyle: "hiddenInset",
            titleBarOverlay: true,
            backgroundColor: "#1E2023",
            webPreferences: {
                nodeIntegration: true,
                backgroundThrottling: false,
                contextIsolation: false,
                sandbox: false,
                preload: path.join(__dirname, "./preload.js"),
                additionalArguments
            }
        });
        mainWindow.setBounds({
            height: mainWindowState.height || 720,
            width: mainWindowState.width || 1280
        }, false);

        mainWindow.webContents.setWindowOpenHandler(({ frameName, url }) => {
            if (frameName === "modal") {
                return {
                    action: "allow",
                    overrideBrowserWindowOptions: {
                        title: "Firebot",
                        frame: true,
                        titleBarStyle: "default",
                        parent: mainWindow,
                        width: 250,
                        height: 400,
                        javascript: false
                    }
                };
            }

            void shell.openExternal(url);
            return { action: "deny" };
        });

        this.mainWindow = mainWindow;
        globalThis.renderWindow = this.mainWindow;

        await this.createAppMenu();

        attachTitlebarToWindow(this.mainWindow);

        // register listeners on the window, so we can update the state
        // automatically (the listeners will be removed when the window is closed)
        // and restore the maximized or full screen state
        mainWindowState.manage(this.mainWindow);

        // and load the index.html of the app.
        void this.mainWindow.loadURL(
            url.format({
                pathname: path.join(__dirname, "../../../gui/app/index.html"),
                protocol: "file:",
                slashes: true
            })
        );

        // wait for the main window's content to load, then show it
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        this.mainWindow.webContents.on("did-finish-load", async () => {
            createTray(this.mainWindow);

            this.mainWindow.show();

            if (this._splashscreenWindow) {
                this._splashscreenWindow.destroy();
            }

            await startupScriptsManager.runStartupScripts();

            void eventManager.triggerEvent("firebot", "firebot-started", {
                username: "Firebot"
            });

            if (SettingsManager.getSetting("OpenStreamPreviewOnLaunch") === true) {
                this.createStreamPreviewWindow();
            }

            if (SettingsManager.getSetting("OpenEffectQueueMonitorOnLaunch") === true) {
                void createEffectQueueMonitorWindow();
            }

            fileOpenHelpers.setWindowReady(true);
        });


        this.mainWindow.on("close", (event) => {
            if (!SettingsManager.getSetting("JustUpdated") && connectionManager.chatIsConnected() && connectionManager.streamerIsOnline()) {
                event.preventDefault();
                dialog.showMessageBox(this.mainWindow, {
                    message: "Are you sure you want to close Firebot while connected to Twitch?",
                    title: "Close Firebot",
                    type: "question",
                    buttons: ["Close Firebot", "Cancel"]

                }).then(({ response }) => {
                    if (response === 0) {
                        mainWindow.destroy();
                        global.renderWindow = null;
                    }
                }).catch(() => console.log("Error with close app confirmation"));
            } else {
                this.mainWindow.destroy();
                global.renderWindow = null;
            }
        });

        this.mainWindow.on("closed", () => {
            this.events.emit("main-window-closed");

            if (this._variableInspectorWindow?.isDestroyed() === false) {
                logger.debug("Closing variable inspector window");
                this._variableInspectorWindow.destroy();
            }

            const effectQueueMonitorWindow = getEffectQueueMonitorWindow();
            if (effectQueueMonitorWindow?.isDestroyed() === false) {
                logger.debug("Effect queue monitor window");
                effectQueueMonitorWindow.destroy();
            }

            if (this._streamPreview?.isDestroyed() === false) {
                logger.debug("Closing stream preview window");
                this._streamPreview.destroy();
            }
        });
    }

    async createSplashScreen() {
        this._splashscreenWindow = new BrowserWindow({
            width: 375,
            height: 420,
            icon: path.join(__dirname, "../../../gui/images/logo_transparent_2.png"),
            transparent: true,
            backgroundColor: undefined,
            frame: false,
            closable: false,
            fullscreenable: false,
            movable: false,
            resizable: false,
            center: true,
            show: false,
            webPreferences: {
                preload: path.join(__dirname, "../../../gui/splashscreen/preload.js")
            }
        });

        this._splashscreenWindow.once("ready-to-show", () => {
            logger.debug("...Showing splash screen");
            this._splashscreenWindow.show();
        });

        logger.debug("...Attempting to load splash screen url");
        return this._splashscreenWindow.loadURL(
            url.format({
                pathname: path.join(__dirname, "../../../gui/splashscreen/splash.html"),
                protocol: "file:",
                slashes: true
            }))
            .then(() => {
                logger.debug("Loaded splash screen");
            }).catch((reason) => {
                logger.error("Failed to load splash screen", reason);
            });
    }

    updateSplashScreenStatus(newStatus: string) {
        if (this._splashscreenWindow == null || this._splashscreenWindow.isDestroyed()) {
            return;
        }

        this._splashscreenWindow.webContents.send("update-splash-screen-status", newStatus);
    }

    async createVariableInspectorWindow() {
        if (this._variableInspectorWindow != null && !this._variableInspectorWindow.isDestroyed()) {
            if (this._variableInspectorWindow.isMinimized()) {
                this._variableInspectorWindow.restore();
            }
            this._variableInspectorWindow.focus();
            return;
        }

        const variableInspectorWindowState = windowStateKeeper({
            defaultWidth: 720,
            defaultHeight: 1280,
            file: "variable-inspector-window-state.json"
        });

        this._variableInspectorWindow = new BrowserWindow({
            frame: true,
            alwaysOnTop: true,
            backgroundColor: "#2F3137",
            title: "Custom Variable Inspector",
            parent: this.mainWindow,
            width: variableInspectorWindowState.width,
            height: variableInspectorWindowState.height,
            x: variableInspectorWindowState.x,
            y: variableInspectorWindowState.y,
            webPreferences: {
                preload: path.join(__dirname, "../../../gui/variable-inspector/preload.js")
            },
            icon: path.join(__dirname, "../../../gui/images/logo_transparent_2.png")
        });
        this._variableInspectorWindow.setMenu(null);

        variableInspectorWindowState.manage(this._variableInspectorWindow);

        this._variableInspectorWindow.on("close", () => {
            this._variableInspectorWindow = null;
        });

        await this._variableInspectorWindow.loadURL(
            url.format({
                pathname: path.join(__dirname, "../../../gui/variable-inspector/index.html"),
                protocol: "file:",
                slashes: true
            }));

        this._variableInspectorWindow.webContents.send("all-variables", customVariableManager.getInitialInspectorVariables());
    }

    sendVariableCreateToInspector(key: string, value: string, ttl: number) {
        if (this._variableInspectorWindow == null || this._variableInspectorWindow.isDestroyed()) {
            return;
        }

        this._variableInspectorWindow.webContents.send("variable-set", {
            key,
            value,
            ttl
        });
    }

    sendVariableExpireToInspector(key: string, value: string) {
        if (this._variableInspectorWindow == null || this._variableInspectorWindow.isDestroyed()) {
            return;
        }

        this._variableInspectorWindow.webContents.send("variable-expire", {
            key,
            value
        });
    }

    sendVariableDeleteToInspector(key: string) {
        if (this._variableInspectorWindow == null || this._variableInspectorWindow.isDestroyed()) {
            return;
        }

        this._variableInspectorWindow.webContents.send("variable-deleted", {
            key
        });
    }
}

setupTitlebar();

const manager = new WindowManager();

SettingsManager.on("settings:setting-updated:OverlayInstances", () => {
    void manager.createAppMenu();
});

frontendCommunicator.on("getAllDisplays", () => {
    return screenHelpers.getAllDisplays();
});

frontendCommunicator.on("getPrimaryDisplay", () => {
    return screenHelpers.getPrimaryDisplay();
});

frontendCommunicator.on("takeScreenshot", (displayId: number) => {
    return screenHelpers.takeScreenshot(displayId);
});

export { manager as WindowManager };