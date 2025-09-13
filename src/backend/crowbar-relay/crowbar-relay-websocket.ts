import ReconnectingWebSocket from '../reconnecting-websocket';
import accountAccess from "../common/account-access";
import { TypedEmitter } from "tiny-typed-emitter";
import logger from "../logwrapper";

class CrowbarRelayWebSocket extends TypedEmitter<{
    "ready": () => void,
    "message": (msg: {
        event: string;
        data: unknown;
    }) => void
}> {
    private ws: ReconnectingWebSocket | null = null;

    constructor() {
        super();
        accountAccess.readyPromise.then(() => {
            this.start();
        });
        accountAccess.events.on("account-update", () => {
            this.start();
        });
    }

    private start() {
        if (this.ws != null) {
            this.ws.close();
            this.ws = null;
        }

        const streamer = accountAccess.getAccounts().streamer;

        if (!streamer.loggedIn) {
            return;
        }

        logger.info("Starting Crowbar Relay WebSocket...");

        this.ws = new ReconnectingWebSocket(`wss://api.crowbar.tools/v1/relay`, undefined, {
            wsOptions: {
                headers: {
                    Authorization: `Bearer ${streamer.auth.access_token}`
                }
            }
        });

        this.ws.addEventListener("open", () => {
            logger.info("Crowbar Relay WebSocket connected!");
            this.emit("ready");
        });

        this.ws.addEventListener("error", (err) => {
            logger.error("Crowbar Relay WebSocket error:", err);
        });

        this.ws.addEventListener("close", () => {
            logger.info("Crowbar Relay WebSocket disconnected!");
        });

        this.ws.addEventListener("message", (msg) => {
            logger.debug("Crowbar Relay WebSocket message:", msg.data);
            try {
                this.emit("message", JSON.parse(msg.data));
            } catch (e) {
                logger.error("Crowbar Relay WebSocket message parse error:", e);
            }
        });
    }

    public send(event: string, data: unknown = {}) {
        if (!this.ws) {
            return;
        }
        this.ws.send(JSON.stringify({
            event,
            data
        }));
    }
}

export const crowbarRelayWebSocket = new CrowbarRelayWebSocket();