import { BrowserWindow } from "electron";
import windowStateKeeper from "electron-window-state";
import { SecretsManager } from "../../../secrets-manager";
import path from "path";
import url from "url";

import frontendCommunicator from "../../../common/frontend-communicator";
import effectQueueConfigManager from "../../../effects/queues/effect-queue-config-manager";
import effectQueueRunner from "../../../effects/queues/effect-queue-runner";
import type { QueueState } from "../../../effects/queues/effect-queue";

let effectQueueMonitorWindow: BrowserWindow = null;

export function getEffectQueueMonitorWindow(): BrowserWindow | null {
    return effectQueueMonitorWindow;
}

export async function createEffectQueueMonitorWindow() {

    if (effectQueueMonitorWindow != null && !effectQueueMonitorWindow.isDestroyed()) {
        if (effectQueueMonitorWindow.isMinimized()) {
            effectQueueMonitorWindow.restore();
        }
        effectQueueMonitorWindow.focus();
        return;
    }

    const effectQueueMonitorWindowState = windowStateKeeper({
        defaultWidth: 720,
        defaultHeight: 1280,
        file: "effect-queue-monitor-window-state.json"
    });

    effectQueueMonitorWindow = new BrowserWindow({
        frame: true,
        backgroundColor: "#2F3137",
        title: "Effect Queue Monitor",
        width: effectQueueMonitorWindowState.width,
        height: effectQueueMonitorWindowState.height,
        x: effectQueueMonitorWindowState.x,
        y: effectQueueMonitorWindowState.y,
        webPreferences: {
            preload: path.join(__dirname, "../../../../gui/effect-queue-monitor/preload.js")
        },
        icon: path.join(__dirname, "../../../../gui/images/logo_transparent_2.png")
    });
    effectQueueMonitorWindow.setMenu(null);

    effectQueueMonitorWindowState.manage(effectQueueMonitorWindow);

    effectQueueMonitorWindow.on("close", () => {
        effectQueueMonitorWindow = null;
    });

    await effectQueueMonitorWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, "../../../../gui/effect-queue-monitor/index.html"),
            protocol: "file:",
            slashes: true,
            query: {
                fontAwesomeKitId: SecretsManager.secrets.fontAwesome5KitId
            }
        }));

    const queueConfigs = effectQueueConfigManager.getAllItems();

    const queueConfigsWithState = queueConfigs.map((queueConfig) => {
        const queueState = effectQueueRunner.getQueueStateForConfig(queueConfig);
        return {
            ...queueConfig,
            state: queueState
        };
    });

    effectQueueMonitorWindow.webContents.send("all-queues", queueConfigsWithState);

    return effectQueueMonitorWindow;
}

function sendToWindow(event: string, data: unknown) {
    if (effectQueueMonitorWindow == null || effectQueueMonitorWindow.isDestroyed()) {
        return;
    }
    effectQueueMonitorWindow.webContents.send(event, data);
}

effectQueueConfigManager.on("created-item", (queueConfig) => {
    const queueState = effectQueueRunner.getQueueStateForConfig(queueConfig);
    sendToWindow("queue-created", {
        ...queueConfig,
        state: queueState
    });
});

effectQueueConfigManager.on("updated-item", (queueConfig) => {
    const queueState = effectQueueRunner.getQueueStateForConfig(queueConfig);
    sendToWindow("queue-updated", {
        ...queueConfig,
        state: queueState
    });
});

effectQueueConfigManager.on("deleted-item", (queueConfig) => {
    sendToWindow("queue-deleted", queueConfig.id);
});

effectQueueRunner.on("queue-state-updated", (queueId, queueState: QueueState) => {
    const queueConfig = effectQueueConfigManager.getItem(queueId);
    if (queueConfig == null) {
        return;
    }
    sendToWindow("queue-updated", {
        ...queueConfig,
        state: queueState
    });
});

frontendCommunicator.on("open-effect-queue-monitor", () => {
    createEffectQueueMonitorWindow();
});
