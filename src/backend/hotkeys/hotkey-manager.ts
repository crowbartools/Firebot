import { globalShortcut } from "electron";
import { JsonDB } from "node-json-db";
import { v4 as uuid } from "uuid";

import { FirebotHotkey } from "../../types/hotkeys";
import { Trigger } from "../../types/triggers";

import { ProfileManager } from "../../backend/common/profile-manager";
import accountAccess from "../common/account-access";
import effectRunner from "../common/effect-runner";
import frontendCommunicator from "../common/frontend-communicator";
import logger from "../logwrapper";

class HotkeyManager {
    hotkeys: FirebotHotkey[] = [];

    constructor() {
        frontendCommunicator.on("hotkeys:get-hotkeys", () => {
            return this.hotkeys;
        });

        frontendCommunicator.on("hotkeys:add-hotkey", (hotkey: FirebotHotkey) => {
            this.addHotkey(hotkey);
        });

        frontendCommunicator.on("hotkeys:update-hotkey", (hotkey: FirebotHotkey) => {
            this.updateHotkey(hotkey);
        });

        frontendCommunicator.on("hotkeys:delete-hotkey", (id: string) => {
            this.deleteHotkey(id);
        });

        frontendCommunicator.on("hotkeys:pause-hotkeys", () => {
            this.unregisterAllHotkeys();
        });

        frontendCommunicator.on("hotkeys:resume-hotkeys", () => {
            this.registerAllHotkeys();
        });
    }

    private getHotkeyDb(): JsonDB {
        return ProfileManager.getJsonDbInProfile("/hotkeys");
    }

    loadHotkeys(): void {
        try {
            const hotkeyData = this.getHotkeyDb().getData("/") as FirebotHotkey[];

            if (hotkeyData?.length) {
                this.hotkeys = hotkeyData || [];
            }

            this.unregisterAllHotkeys();
            this.registerAllHotkeys();

            frontendCommunicator.send("hotkeys:hotkeys-updated", this.hotkeys);
            logger.info("Loaded hotkeys");
        } catch (err) {
            logger.error("Error loading hotkeys", err);
        }
    }

    unregisterAllHotkeys(): void {
        globalShortcut.unregisterAll();
    }

    addHotkey(hotkey: FirebotHotkey): void {
        hotkey.id ??= uuid();

        this.hotkeys.push(hotkey);
        this.registerHotkey(hotkey.code);

        this.saveHotkeys();
    }

    updateHotkey(hotkey: FirebotHotkey): void {
        const index = this.hotkeys.findIndex(h => h.id === hotkey.id);

        const existingHotkey = this.hotkeys.find(h => h.id === hotkey.id);

        // If the hotkey code has changed or the hotkey has been deactivated, unregister the old one
        if (existingHotkey.code !== hotkey.code || hotkey.active !== existingHotkey.active) {
            if (globalShortcut.isRegistered(existingHotkey.code)) {
                try {
                    globalShortcut.unregister(existingHotkey.code);
                } catch {}
            }
            if (hotkey.active !== false) {
                this.registerHotkey(hotkey.code);
            }
        }

        if (index > -1) {
            this.hotkeys[index] = hotkey;

            this.saveHotkeys();
        }
    }

    deleteHotkey(id: string): void {
        const hotkey = this.hotkeys.find(h => h.id === id);

        this.hotkeys.splice(this.hotkeys.indexOf(hotkey), 1);

        try {
            globalShortcut.unregister(hotkey.code);
        } catch {}

        this.saveHotkeys();
    }

    private saveHotkeys(): void {
        try {
            this.getHotkeyDb().push("/", this.hotkeys);
        } catch (error) {
            logger.error("Error saving hotkeys", error);
        }

        frontendCommunicator.send("hotkeys:hotkeys-updated", this.hotkeys);
    }

    private registerAllHotkeys(): void {
        if (this.hotkeys == null) {
            return;
        }

        this.hotkeys.filter(h => h.active).forEach((k) => {
            this.registerHotkey(k.code);
        });
    }

    private registerHotkey(accelerator: Electron.Accelerator): void {
        try {
            const success = globalShortcut.register(accelerator, () => {
                this.runHotkey(accelerator);
            });

            if (!success) {
                logger.warn(`Unable to register hotkey ${accelerator} with OS. This typically means it is already taken by another application.`);
            }
        } catch (error) {
            logger.error(`Error while registering hotkey ${accelerator} with OS`, error);
        }
    }

    private runHotkey(code: Electron.Accelerator): void {
        const hotkey = this.hotkeys.find(k => k.code === code);

        const effects = hotkey.effects;

        if (effects == null) {
            return;
        }

        const processEffectsRequest = {
            trigger: {
                type: "hotkey",
                metadata: {
                    username: accountAccess.getAccounts().streamer.username,
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