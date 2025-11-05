import { globalShortcut } from "electron";

import { FirebotHotkey } from "../../types/hotkeys";
import { Trigger } from "../../types/triggers";

import { AccountAccess } from "../common/account-access";
import effectRunner from "../common/effect-runner";
import frontendCommunicator from "../common/frontend-communicator";
import logger from "../logwrapper";
import JsonDbManager from "../database/json-db-manager";

class HotkeyManager extends JsonDbManager<FirebotHotkey> {
    hotkeys: FirebotHotkey[] = [];

    constructor() {
        super("Hotkey", "hotkeys");

        frontendCommunicator.on("hotkeys:get-hotkeys",
            () => this.getAllItems());

        frontendCommunicator.on("hotkeys:save-hotkey",
            (hotkey: FirebotHotkey) => this.saveItem(hotkey));

        frontendCommunicator.on("hotkeys:save-all-hotkeys",
            (allHotkeys: FirebotHotkey[]) => this.saveAllItems(allHotkeys));

        frontendCommunicator.on("hotkeys:delete-hotkey",
            (id: string) => this.deleteItem(id));

        frontendCommunicator.on("hotkeys:pause-hotkeys",
            () => this.unregisterAllHotkeys());

        frontendCommunicator.on("hotkeys:resume-hotkeys",
            () => this.registerAllHotkeys());
    }

    override loadItems(): void {
        super.loadItems();

        try {
            this.unregisterAllHotkeys();
            this.registerAllHotkeys();

            logger.debug("Registered hotkeys");
        } catch (err) {
            logger.error("Error registering hotkeys", err);
        }
    }

    override saveItem(hotkey: FirebotHotkey): FirebotHotkey {
        const existingHotkey = this.getItem(hotkey.id);

        // If the hotkey code has changed or the hotkey has been deactivated, unregister the old one
        if (existingHotkey && globalShortcut.isRegistered(existingHotkey.code)) {
            this.unregisterHotkey(existingHotkey.code);
        }

        if (hotkey.active === true) {
            hotkey.warning = this.registerHotkey(hotkey.code);
        } else {
            this.unregisterHotkey(hotkey.code);
        }

        return super.saveItem(hotkey);
    }

    override deleteItem(id: string): boolean {
        const hotkey = this.getItem(id);

        if (hotkey) {
            this.unregisterHotkey(hotkey.code);
            return super.deleteItem(id);
        }

        return false;
    }

    triggerUiRefresh(): void {
        frontendCommunicator.send("hotkeys:all-hotkeys-updated", this.getAllItems());
    }

    unregisterAllHotkeys(): void {
        let hotkeys = this.getAllItems();
        if (!hotkeys.length) return;

        hotkeys.filter(h => h.active).forEach((k) => {
            k.warning = "";
            this.unregisterHotkey(k.code);
        });

        this.saveAllItems(hotkeys);
        this.triggerUiRefresh();
    }

    
    private unregisterHotkey(accelerator: Electron.Accelerator): void {
        try {
            globalShortcut.unregister(accelerator);
        } catch {}
    }

    private registerAllHotkeys(): void {
        let hotkeys = this.getAllItems();
        if (!hotkeys.length) return;

        hotkeys.filter(h => h.active).forEach((k) => {
            k.warning = this.registerHotkey(k.code);
        });

        this.saveAllItems(hotkeys);
        this.triggerUiRefresh();
    }

    private registerHotkey(accelerator: Electron.Accelerator): string {
        if (globalShortcut.isRegistered(accelerator)) return "";
        
        try {
            const success = globalShortcut.register(accelerator, () => {
                this.runHotkey(accelerator);
            });

            if (!success) {
                logger.warn(`Unable to register hotkey ${accelerator} with OS. This typically means it is already taken by another application.`);
                
                return "Firebot is unable to register this hotkey, because it is already taken by another application.";
            }

            return "";
        } catch (error) {
            logger.error(`Error while registering hotkey ${accelerator} with OS`, error);
            return "An error occurred while attempting to register this hotkey. Check the logs for more information.";
        }
    }

    private runHotkey(code: Electron.Accelerator): void {
        const hotkey = this.getAllItems().find(k => k.code === code);

        const effects = hotkey.effects;
        if (!effects) return;

        const processEffectsRequest = {
            trigger: {
                type: "hotkey",
                metadata: {
                    username: AccountAccess.getAccounts().streamer.username,
                    hotkey: hotkey
                }
            } as Trigger,
            effects: effects
        };
        void effectRunner.processEffects(processEffectsRequest);
    }
}

const hotkeyManager = new HotkeyManager();

export { hotkeyManager as HotkeyManager };