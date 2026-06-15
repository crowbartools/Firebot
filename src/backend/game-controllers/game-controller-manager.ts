import type { FirebotGameControllerBinding, Trigger } from "../../types";

import { AccountAccess } from "../common/account-access";
import effectRunner from "../common/effect-runner";
import frontendCommunicator from "../common/frontend-communicator";
import JsonDbManager from "../database/json-db-manager";

class GameControllerManager extends JsonDbManager<FirebotGameControllerBinding> {
    constructor() {
        super("GameControllerBinding", "game-controller-bindings", "GameControllerBindings");

        frontendCommunicator.on("game-controller:get-bindings",
            () => this.getAllItems());

        frontendCommunicator.on("game-controller:save-binding",
            (binding: FirebotGameControllerBinding) => this.saveItem(binding));

        frontendCommunicator.on("game-controller:save-all-bindings",
            (bindings: FirebotGameControllerBinding[]) => this.saveAllItems(bindings));

        frontendCommunicator.on("game-controller:delete-binding",
            (id: string) => this.deleteItem(id));

        frontendCommunicator.on("game-controller:button-pressed",
            (data: { controllerIndex: number, buttonIndex: number }) => {
                this.handleButtonPress(data.controllerIndex, data.buttonIndex);
            });
    }

    override loadItems(): void {
        super.loadItems();
        this.logger.debug("Loaded game controller bindings");
    }

    triggerUiRefresh(): void {
        frontendCommunicator.send("game-controller:all-bindings-updated", this.getAllItems());
    }

    private handleButtonPress(controllerIndex: number, buttonIndex: number): void {
        const binding = this.getAllItems().find(b =>
            b.active &&
            b.button === buttonIndex &&
            (b.controllerIndex == null || b.controllerIndex === controllerIndex)
        );

        if (!binding?.effects) {
            return;
        }

        const processEffectsRequest = {
            trigger: {
                // "hotkey" is used intentionally so game controller bindings are compatible with all
                // hotkey-supporting effects without needing to audit every effect definition.
                // A dedicated "game controller" trigger type can be introduced in a follow-up.
                type: "hotkey",
                metadata: {
                    username: AccountAccess.getAccounts().streamer.username,
                    hotkey: binding,
                    gameControllerBinding: binding,
                    controllerIndex,
                    buttonIndex
                }
            } as Trigger,
            effects: binding.effects
        };
        void effectRunner.processEffects(processEffectsRequest);
    }
}

const gameControllerManager = new GameControllerManager();
export { gameControllerManager as GameControllerManager };
