import {
    ControlDeck,
    ControlDeckControl,
    Trigger
} from "../../types";

import JsonDbManager from "../database/json-db-manager";
import { AccountAccess } from "../common/account-access";
import effectRunner from "../common/effect-runner";
import frontendCommunicator from "../common/frontend-communicator";
import { SettingsManager } from "../common/settings-manager";


class ControlDeckManager extends JsonDbManager<ControlDeck> {
    constructor() {
        super("Control Deck", "/control-deck/decks", "Control Deck");

        frontendCommunicator.on("control-deck:get-decks",
            () => this.getAllItems()
        );

        frontendCommunicator.on("control-deck:get-deck",
            (deckId: string) => this.getItem(deckId)
        );

        frontendCommunicator.on("control-deck:save-deck",
            (deck: ControlDeck) => this.saveDeck(deck)
        );

        frontendCommunicator.on("control-deck:delete-deck",
            (deckId: string) => this.deleteDeck(deckId)
        );

        const sendSettingsToControlDecks = () => {
            const enabled = SettingsManager.getSetting("ControlDeckEnabled");
            const pin = SettingsManager.getSetting("ControlDeckPin");
            const orientationMode = SettingsManager.getSetting("ControlDeckOrientationMode");
            const defaultDeckId = SettingsManager.getSetting("ControlDeckDefaultDeckId");
            this.broadcastToControlDecks("control-deck:settings-updated", {
                enabled: enabled === true,
                pinRequired: pin != null && pin !== "",
                orientationMode: orientationMode,
                defaultDeckId: defaultDeckId ?? null
            });
        };

        SettingsManager.on("settings:setting-updated:ControlDeckEnabled", sendSettingsToControlDecks);
        SettingsManager.on("settings:setting-updated:ControlDeckPin", sendSettingsToControlDecks);
        SettingsManager.on("settings:setting-updated:ControlDeckOrientationMode", sendSettingsToControlDecks);
        SettingsManager.on("settings:setting-updated:ControlDeckDefaultDeckId", sendSettingsToControlDecks);

    }

    saveDeck(deck: ControlDeck, notify = true): ControlDeck {
        const savedDeck = super.saveItem(deck);
        if (!savedDeck) {
            return null;
        }

        if (notify) {
            this.triggerUiRefresh();
        }

        this.broadcastToControlDecks("control-deck:deck-updated", savedDeck);

        return savedDeck;
    }

    deleteDeck(deckId: string): void {
        if (super.deleteItem(deckId)) {
            this.triggerUiRefresh();
            this.broadcastToControlDecks("control-deck:deck-deleted", deckId);
        }
    }

    getControl(deckId: string, controlId: string): ControlDeckControl | null {
        const deck = this.getItem(deckId);
        if (deck == null) {
            return null;
        }
        return deck.controls?.find(c => c.id === controlId) ?? null;
    }

    triggerControl(deckId: string, controlId: string, inputValues?: Record<string, string | number | boolean>): boolean {
        const control = this.getControl(deckId, controlId);

        if (control == null || control.type !== "button" || control.effectList == null) {
            return false;
        }

        const deck = this.getItem(deckId);

        const request = {
            trigger: {
                type: "control_deck",
                metadata: {
                    username: AccountAccess.getAccounts().streamer.username,
                    deckId: deckId,
                    deckName: deck?.name,
                    controlId: control.id,
                    controlName: control.name,
                    inputValues: inputValues ?? {}
                }
            } as Trigger,
            effects: control.effectList
        };

        void effectRunner.processEffects(request);
        return true;
    }

    private broadcastToControlDecks(eventName: string, data: unknown): void {
        try {
            // Lazy require to avoid a circular dep
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const { HttpServerManager } = require("../../server/http-server-manager");

            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            HttpServerManager.sendToControlDecks(eventName, data);
        } catch (err) {
            this.logger.debug("Unable to broadcast Control Deck update.", err);
        }
    }

    triggerUiRefresh(): void {
        frontendCommunicator.send("control-deck:decks-updated", this.getAllItems());
    }
}

const controlDeckManager = new ControlDeckManager();

export { controlDeckManager as ControlDeckManager };
