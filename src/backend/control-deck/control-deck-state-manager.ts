import JsonDbManager from "../database/json-db-manager";
import { LoggerCache } from "../logger-cache";

type ControlStateRecord = {
    /** The control id. */
    id: string;
    state: unknown;
};

class ControlDeckStateManager extends JsonDbManager<ControlStateRecord> {
    private stateLogger = LoggerCache.getLogger("Control Deck");

    constructor() {
        super("Control State", "/control-deck/control-state", "Control Deck");
    }

    getControlState(controlId: string): unknown {
        return this.getItem(controlId)?.state;
    }

    setControlState(
        deckId: string,
        controlId: string,
        state: unknown,
        { broadcast = true }: { broadcast?: boolean } = {}
    ): void {
        this.saveItem({ id: controlId, state });

        if (broadcast) {
            this.broadcastToControlDecks("control-deck:control-state-updated", {
                deckId,
                controlId,
                state
            });
        }
    }

    deleteControlState(controlId: string): void {
        this.deleteItem(controlId);
    }

    private broadcastToControlDecks(eventName: string, data: unknown): void {
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const { HttpServerManager } = require("../../server/http-server-manager");

            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            HttpServerManager.sendToControlDecks(eventName, data);
        } catch (err) {
            this.stateLogger.debug("Unable to broadcast Control Deck state update.", err);
        }
    }
}

const controlDeckStateManager = new ControlDeckStateManager();

export { controlDeckStateManager as ControlDeckStateManager };
