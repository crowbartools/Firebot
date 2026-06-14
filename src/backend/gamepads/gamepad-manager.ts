import type { FirebotGamepadBinding, Trigger } from "../../types";

import { AccountAccess } from "../common/account-access";
import effectRunner from "../common/effect-runner";
import frontendCommunicator from "../common/frontend-communicator";
import JsonDbManager from "../database/json-db-manager";

class GamepadManager extends JsonDbManager<FirebotGamepadBinding> {
    constructor() {
        super("GamepadBinding", "gamepad-bindings", "GamepadBindings");

        frontendCommunicator.on("gamepad:get-bindings",
            () => this.getAllItems());

        frontendCommunicator.on("gamepad:save-binding",
            (binding: FirebotGamepadBinding) => this.saveItem(binding));

        frontendCommunicator.on("gamepad:save-all-bindings",
            (bindings: FirebotGamepadBinding[]) => this.saveAllItems(bindings));

        frontendCommunicator.on("gamepad:delete-binding",
            (id: string) => this.deleteItem(id));

        frontendCommunicator.on("gamepad:button-pressed",
            (data: { gamepadIndex: number, buttonIndex: number }) => {
                this.handleButtonPress(data.gamepadIndex, data.buttonIndex);
            });
    }

    override loadItems(): void {
        super.loadItems();
        this.logger.debug("Loaded gamepad bindings");
    }

    triggerUiRefresh(): void {
        frontendCommunicator.send("gamepad:all-bindings-updated", this.getAllItems());
    }

    private handleButtonPress(gamepadIndex: number, buttonIndex: number): void {
        const binding = this.getAllItems().find(b =>
            b.active &&
            b.button === buttonIndex &&
            (b.gamepadIndex == null || b.gamepadIndex === gamepadIndex)
        );

        if (!binding?.effects) {
            return;
        }

        const processEffectsRequest = {
            trigger: {
                // "hotkey" is used intentionally so gamepad bindings are compatible with all
                // hotkey-supporting effects without needing to audit every effect definition.
                // A dedicated "gamepad" trigger type can be introduced in a follow-up.
                type: "hotkey",
                metadata: {
                    username: AccountAccess.getAccounts().streamer.username,
                    hotkey: binding,
                    gamepadBinding: binding,
                    gamepadIndex,
                    buttonIndex
                }
            } as Trigger,
            effects: binding.effects
        };
        void effectRunner.processEffects(processEffectsRequest);
    }
}

const gamepadManager = new GamepadManager();
export { gamepadManager as GamepadManager };
