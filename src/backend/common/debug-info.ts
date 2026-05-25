

import { app } from "electron";
import os from "os";
import frontendCommunicator from "./frontend-communicator";
import ConnectionManager from "./connection-manager";
import { AccountAccess } from "./account-access";
import HttpServerManager from "../../server/http-server-manager";
import WebsocketServerManager from "../../server/websocket-server-manager";
import startupScriptsManager from "../common/handlers/custom-scripts/startup-scripts-manager";
import { isConnected } from "../integrations/builtin/obs/obs-remote";

function getOsName(platform: NodeJS.Platform): string {
    if (platform === "darwin") {
        return "macOS";
    }

    if (platform === "win32") {
        return "Windows";
    }

    return "Linux";
}

async function getDebugInfoString(): Promise<string> {
    const appVersion = app.getVersion();

    const electronVersion = process.versions.electron ?? "unknown";
    const nodeVersion = process.versions.node ?? process.version;

    const osName = getOsName(process.platform);
    const osVersion = typeof process.getSystemVersion === "function" ? process.getSystemVersion() : os.release();
    const osArch = os.arch();

    const { locale } = Intl.DateTimeFormat().resolvedOptions();

    const accounts = AccountAccess.getAccounts();
    const streamerLoggedIn = accounts.streamer.loggedIn ? "Yes" : "No";
    const botLoggedIn = accounts.bot.loggedIn ? "Yes" : "No";

    const connectedToTwitch = ConnectionManager.chatIsConnected() ? "Connected" : "Disconnected";
    const connectedToOBS = isConnected() ? "Connected" : "Disconnected";

    const httpServerStatus = HttpServerManager.isDefaultServerStarted ? "Running" : "Stopped";
    const websocketClients = WebsocketServerManager.getNumberOfOverlayClients();

    const startupScripts = Object.values(startupScriptsManager.getLoadedStartupScripts());

    return [
        "Firebot Debug Info",
        "------------------",
        `OS: ${osName} ${osVersion} (${osArch})`,
        `Firebot: ${appVersion}`,
        `Electron: ${electronVersion}`,
        `Node: ${nodeVersion}`,
        `Locale: ${locale}\n`,
        'Accounts:',
        `  - Streamer: ${streamerLoggedIn}`,
        `  - Bot: ${botLoggedIn}\n`,
        'Connections:',
        `  - Twitch: ${connectedToTwitch}`,
        `  - OBS: ${connectedToOBS}\n`,
        'Server:',
        `  - HTTP Server: ${httpServerStatus}`,
        `  - Overlay Clients: ${websocketClients}\n`,
        'Plugins:',
        startupScripts.length === 0
            ? "  - None"
            : startupScripts.map(script => `  - ${script.name}`).join("\n")
    ].join("\n");
}

export async function copyDebugInfoToClipboard() {
    const debugInfo = await getDebugInfoString();

    frontendCommunicator.send("copy-to-clipboard", {
        text: debugInfo,
        toastMessage: "Debug information copied to clipboard"
    });
}