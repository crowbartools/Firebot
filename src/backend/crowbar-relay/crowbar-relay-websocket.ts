import ReconnectingWebSocket from '../reconnecting-websocket';
import { AccountAccess } from "../common/account-access";
import { TypedEmitter } from "tiny-typed-emitter";
import { LoggerCache } from '../logger-cache';

class CrowbarRelayWebSocket extends TypedEmitter<{
    "ready": () => void;
    "message": (msg: {
        event: string;
        data: unknown;
    }) => void;
}> {
    private logger = LoggerCache.getLogger("Crowbar Relay");
    private ws: ReconnectingWebSocket | null = null;

    constructor() {
        super();

        void AccountAccess.readyPromise.then(() => {
            this.start();
        });

        AccountAccess.on("account-update", () => {
            this.start();
        });

        AccountAccess.on("account-auth-update", (data) => {
            if (data.accountType === "streamer") {
                this.start();
            }
        });
    }

    private start() {
        if (this.ws != null) {
            this.ws.close();
            this.ws = null;
        }

        const streamer = AccountAccess.getAccounts().streamer;

        if (!streamer.loggedIn) {
            return;
        }

        this.logger.info("Starting Crowbar Relay WebSocket...");

        this.ws = new ReconnectingWebSocket(`wss://api.crowbar.tools/v1/relay`, undefined, {
            wsOptions: {
                headers: {
                    Authorization: `Bearer ${streamer.auth.access_token}`
                }
            }
        });

        let pingTimeout: NodeJS.Timeout;

        function setPingTimeout() {
            clearTimeout(pingTimeout);
            pingTimeout = setTimeout(() => {
                this.logger.warn("Crowbar Relay WebSocket ping timeout, reconnecting...");
                this.ws.reconnect();
            }, 75_000);
        }

        setPingTimeout();

        this.ws.addEventListener("open", () => {
            this.logger.info("Crowbar Relay WebSocket connected!");
            this.emit("ready");
        });

        this.ws.addEventListener("ping", () => {
            setPingTimeout();
        });

        this.ws.addEventListener("error", (err) => {
            this.logger.error("Crowbar Relay WebSocket errored", err.message);
        });

        this.ws.addEventListener("close", (closedEvent) => {
            clearTimeout(pingTimeout);
            const unauthorized = closedEvent.target?._ws?._req?.res?.statusCode === 401;
            if (unauthorized) {
                this.logger.error("Crowbar Relay WebSocket unauthorized!");
                this.ws.close();
            } else {
                this.logger.info("Crowbar Relay WebSocket disconnected!");
            }
        });

        this.ws.addEventListener("message", (msg) => {
            try {
                this.emit("message", JSON.parse(msg.data));
            } catch (e) {
                this.logger.error("Crowbar Relay WebSocket message parse error:", e);
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