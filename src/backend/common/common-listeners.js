"use strict";

const { dialog } = require("electron");
const os = require('os');
const logger = require("../logger-cache").LoggerCache.getLogger("Core");
const { restartApp } = require("../app-management/electron/app-helpers");
const { copyDebugInfoToClipboard } = require("../common/debug-info");

function getLocalIpAddress() {
    try {
        const networkInterfaces = os.networkInterfaces();
        for (const interfaceName of Object.keys(networkInterfaces)) {
            const addresses = networkInterfaces[interfaceName];
            for (const address of addresses) {
                // Look for IPv4 addresses that are not internal (loopback)
                if (address.family === 'IPv4' && !address.internal) {
                    return address.address;
                }
            }
        }
    } catch {}
    return null;
}

exports.setupCommonListeners = () => {
    const { HttpServerManager } = require("../../server/http-server-manager");
    const frontendCommunicator = require("./frontend-communicator");

    frontendCommunicator.onAsync("get-ip-address", async () => {
        return getLocalIpAddress();
    });

    frontendCommunicator.onAsync("getPlatform", async () => {
        return process.platform;
    });

    frontendCommunicator.on("show-variable-inspector", () => {
        const windowManagement = require("../app-management/electron/window-management");
        windowManagement.createVariableInspectorWindow();
    });

    frontendCommunicator.onAsync("show-save-dialog", async (data) => {
        /**@type {Electron.SaveDialogOptions} */
        const options = data.options || {};

        /**@type {Electron.SaveDialogReturnValue} */
        let dialogResult = null;
        try {
            dialogResult = await dialog.showSaveDialog(options);
        } catch (error) {
            logger.error("Failed to show save dialog", error);
        }
        return dialogResult;
    });

    frontendCommunicator.onAsync("open-file-browser", async (data) => {
        const uuid = data.uuid,
            options = data.options || {};

        let dialogResult = null;
        try {
            dialogResult = await dialog.showOpenDialog({
                title: options.title ? options.title : undefined,
                buttonLabel: options.buttonLabel ? options.buttonLabel : undefined,
                properties: options.directoryOnly ? ["openDirectory"] : ["openFile"],
                filters: options.filters ? options.filters : undefined,
                defaultPath: data.currentPath ? data.currentPath : undefined
            });
        } catch (err) {
            logger.debug("Unable to get file path", err);
        }

        let path = null;
        if (dialogResult && !dialogResult.canceled && dialogResult.filePaths != null && dialogResult.filePaths.length > 0) {
            path = dialogResult.filePaths[0];
        }

        return { path: path, id: uuid };
    });

    frontendCommunicator.on("highlight-message", (data) => {
        const { EventManager } = require("../events/event-manager");
        EventManager.triggerEvent("firebot", "highlight-message", data);
    });

    frontendCommunicator.on("category-changed", (category) => {
        const { EventManager } = require("../events/event-manager");
        EventManager.triggerEvent("firebot", "category-changed", { category: category });
    });

    frontendCommunicator.on("restartApp", () => restartApp());

    // Change profile when we get event from renderer
    frontendCommunicator.on("sendToOverlay", (data) => {
        if (data == null) {
            return;
        }
        HttpServerManager.sendToOverlay(data.event, data.meta);
    });

    frontendCommunicator.on("copy-debug-info-to-clipboard", copyDebugInfoToClipboard);
};