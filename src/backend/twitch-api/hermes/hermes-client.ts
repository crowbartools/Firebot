import logger from "../../logwrapper";
import WebSocket from "ws";
import ReconnectingWebSocket from "reconnecting-websocket";
import accountAccess from "../../common/account-access";
import { v4 as uuid } from "uuid";
import { ExtensionMessagePubSubNotificationPayload, HermesReceiveMessage, HermesSendMessageTypes } from "./hermes-types";
import { handleExtensionMessage } from "./extension-message-handler";

const ws = new ReconnectingWebSocket("wss://hermes.twitch.tv/v1?clientId=kimne78kx3ncx6brgo4mv6wki5h1ko", [], {
    WebSocket,
    startClosed: true
});

export function connectToHermes() {
    const streamerLoggedIn = accountAccess.getAccounts().streamer.loggedIn;

    if (!streamerLoggedIn) {
        logger.debug("Can't connect to Hermes WS: streamer not logged in");
        return;
    }

    logger.debug("Connecting to Hermes WS...");

    if (ws.readyState === ws.OPEN) {
        ws.close();
    }

    ws.reconnect();
}

export function disconnectFromHermes() {
    logger.debug("Disconnecting from Hermes WS...");
    ws.close();
}


function sendHermesMessage<T extends keyof HermesSendMessageTypes>(type: T, payload: HermesSendMessageTypes[T]) {
    const message = {
        id: uuid(),
        type,
        timestamp: new Date().toISOString(),
        [type]: payload
    };
    ws.send(JSON.stringify(message));
}

ws.addEventListener("close", (event) => {
    logger.debug(`Hermes WS closed: ${event.reason} (${event.code})`);
});

ws.addEventListener("error", function error(event) {
    logger.error("Hermes WS error", event);
});

ws.addEventListener("open", function open() {
    logger.debug("Hermes WS opened");

    sendHermesMessage("authenticate", {
        token: accountAccess.getAccounts().streamer.auth.access_token
    });
});

ws.addEventListener("message", function message(event) {
    let parsedData: HermesReceiveMessage | undefined;
    try {
        parsedData = JSON.parse(event.data.toString());
    } catch {}

    if (parsedData != null && typeof parsedData === "object") {
        if (parsedData.type === "authenticateResponse") {
            logger.debug("Hermes authenticated!");

            const streamerUserId = accountAccess.getAccounts().streamer.userId;

            sendHermesMessage("subscribe", {
                id: uuid(),
                type: "pubsub",
                pubsub: { topic: `stream-chat-room-v1.${streamerUserId}` }
            });
            return;
        }

        if (parsedData.type === "subscribeResponse") {
            if (parsedData.subscribeResponse.result === "ok") {
                logger.debug("Successfully subscribed to hermes extension message topic");
            }
            return;
        }

        if (parsedData.type === "notification") {
            const rawPayload = parsedData.notification?.pubsub;
            if (rawPayload) {
                try {
                    const payload: ExtensionMessagePubSubNotificationPayload = JSON.parse(rawPayload);
                    if (payload?.type === "extension_message") {
                        handleExtensionMessage(payload);
                    }
                } catch {}
            }
            return;
        }
    }
});