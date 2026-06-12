import {
    ControlDeck,
    ControlDeckControl,
    EffectList,
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

    private buildTriggerEffectList(
        deckId: string,
        control: ControlDeckControl,
        inputValues: Record<string, string | number | boolean> = {}
    ): (effectList: EffectList, extraMetadata?: Record<string, unknown>) => Promise<void> {
        const deck = this.getItem(deckId);
        return async (effectList: EffectList, extraMetadata?: Record<string, unknown>): Promise<void> => {
            if (effectList == null) {
                return;
            }
            const request = {
                trigger: {
                    type: "control_deck",
                    metadata: {
                        username: AccountAccess.getAccounts().streamer.username,
                        deckId: deckId,
                        deckName: deck?.name,
                        controlId: control.id,
                        controlName: control.name,
                        inputValues: inputValues,
                        ...(extraMetadata ?? {})
                    }
                } as Trigger,
                effects: effectList
            };
            await effectRunner.processEffects(request);
        };
    }

    /**
     * Routes a hosted-page interaction to the control's type handler. Returns
     * false when the control or its type can't be resolved.
     */
    async handleInteraction(
        deckId: string,
        controlId: string,
        action: string,
        data: unknown,
        inputValues?: Record<string, string | number | boolean>
    ): Promise<boolean> {
        const control = this.getControl(deckId, controlId);
        if (control == null) {
            return false;
        }

        // Lazy require to avoid a circular dep at module load
        const { ControlDeckControlTypeManager } =
            require("./control-type-manager") as typeof import("./control-type-manager");
        const { ControlDeckStateManager } =
            require("./control-deck-state-manager") as typeof import("./control-deck-state-manager");

        const controlType = ControlDeckControlTypeManager.getControlType(control.type);
        if (controlType == null) {
            this.logger.warn(`Control "${control.name}" has unknown control type "${control.type}"`);
            return false;
        }

        const resolvedInputValues = inputValues ?? {};
        const triggerEffectList = this.buildTriggerEffectList(deckId, control, resolvedInputValues);

        try {
            await controlType.onInteraction(
                {
                    control,
                    deckId,
                    action,
                    data,
                    inputValues: resolvedInputValues
                },
                {
                    triggerEffectList,
                    getState: () => ControlDeckStateManager.getControlState(control.id),
                    // eslint-disable-next-line @typescript-eslint/require-await
                    setState: async (newState: unknown) => {
                        ControlDeckStateManager.setControlState(deckId, control.id, newState);
                    }
                }
            );
        } catch (error) {
            this.logger.error(`Error handling "${action}" interaction for control "${control.name}" (type ${control.type})`, error);
        }

        return true;
    }

    async initializeControlStates(): Promise<void> {
        const { ControlDeckControlTypeManager } =
            require("./control-type-manager") as typeof import("./control-type-manager");
        const { ControlDeckStateManager } =
            require("./control-deck-state-manager") as typeof import("./control-deck-state-manager");

        for (const deck of this.getAllItems()) {
            for (const control of deck.controls ?? []) {
                const controlType = ControlDeckControlTypeManager.getControlType(control.type);
                if (controlType?.state == null) {
                    continue;
                }

                try {
                    const persistedState = ControlDeckStateManager.getControlState(control.id);
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    const initialState = await controlType.state.getInitialState(
                        { control, persistedState },
                        { triggerEffectList: this.buildTriggerEffectList(deck.id, control) }
                    );
                    ControlDeckStateManager.setControlState(deck.id, control.id, initialState, { broadcast: false });
                } catch (error) {
                    this.logger.error(`Error initializing state for control "${control.name}" (type ${control.type})`, error);
                }
            }
        }
    }

    private broadcastToControlDecks(eventName: string, data: unknown): void {
        try {
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
