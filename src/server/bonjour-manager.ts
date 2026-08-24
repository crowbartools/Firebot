import { Bonjour, Service } from "bonjour-service";

import { SettingsManager } from "../backend/common/settings-manager";
import frontendCommunicator from "../backend/common/frontend-communicator";
import { LoggerCache } from "../backend/logger-cache";

// The hostname that the Firebot web server is advertised under via mDNS/Bonjour.
// This allows modern devices on the local network to reach Firebot at http://firebot.local
const FIREBOT_HOSTNAME = "firebot.local";

class BonjourManager {
    private logger = LoggerCache.getLogger("Bonjour");
    private bonjour: Bonjour;
    private service: Service;

    constructor() {
        frontendCommunicator.onAsync("get-bonjour-host", async () => this.getHost());
    }

    start(): void {
        if (this.service != null) {
            return;
        }

        try {
            const port: number = SettingsManager.getSetting("WebServerPort");

            this.bonjour = new Bonjour();
            this.service = this.bonjour.publish({
                name: "Firebot",
                type: "http",
                port,
                host: FIREBOT_HOSTNAME
            });

            this.logger.info(`Published Bonjour service "Firebot" at ${FIREBOT_HOSTNAME}:${port}`);
        } catch (error) {
            this.logger.error("Failed to publish Bonjour service", error);
        }
    }

    stop(): void {
        try {
            if (this.bonjour != null) {
                this.bonjour.unpublishAll(() => {
                    this.bonjour.destroy();
                    this.bonjour = null;
                    this.service = null;
                });
            }
        } catch (error) {
            this.logger.error("Failed to stop Bonjour service", error);
        }
    }

    getHost(): string {
        return this.service != null ? FIREBOT_HOSTNAME : null;
    }
}

const manager = new BonjourManager();

export { manager as BonjourManager };
