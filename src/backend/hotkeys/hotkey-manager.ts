import { globalShortcut } from "electron";
import { JsonDB } from "node-json-db";
import { v4 as uuid } from "uuid";

import logger from "../logwrapper";
import frontendCommunicator from "../common/frontend-communicator.js";
import profileManager from "../../backend/common/profile-manager.js";
import accountAccess from "../common/account-access";
import { TriggerType } from "../common/EffectType";
import effectRunner from "../common/effect-runner";
import { EffectList } from "../../types/effects";

interface FirebotHotkey {
    id: string;
    code: Electron.Accelerator;
    active: boolean;
    effects: EffectList;
}

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
    }

    private getHotkeyDb(): JsonDB {
        return profileManager.getJsonDbInProfile("/hotkeys");
    }

    loadHotkeys() {
        try {
            const hotkeyData = this.getHotkeyDb().getData("/");

            if (hotkeyData?.length) {
                this.hotkeys = hotkeyData || [];
            }

            this.unregisterAllHotkeys();
            this.registerAllHotkeys();

            frontendCommunicator.send("hotkeys:hotkeys-updated", this.hotkeys);
            logger.info("Loaded hotkeys");
        } catch (err) {
            logger.error(err);
        }
    }

    unregisterAllHotkeys() {
        globalShortcut.unregisterAll();
    }

    addHotkey(hotkey: FirebotHotkey) {
        hotkey.id = uuid();

        this.hotkeys.push(hotkey);
        this.registerHotkey(hotkey.code);

        this.saveHotkeys();
    }

    updateHotkey(hotkey: FirebotHotkey) {
        const index = this.hotkeys.findIndex(h => h.id === hotkey.id);

        if (index > -1) {
            this.hotkeys[index] = hotkey;

            this.saveHotkeys();
        }
    }

    deleteHotkey(id: string) {
        const hotkey = this.hotkeys.find(h => h.id === id);

        this.hotkeys.splice(this.hotkeys.indexOf(hotkey), 1);

        globalShortcut.unregister(hotkey.code);

        this.saveHotkeys();
    }

    private saveHotkeys() {
        try {
            this.getHotkeyDb().push("/", this.hotkeys);
        } catch (error) {
            logger.error("Error saving hotkeys", error);
        }

        frontendCommunicator.send("hotkeys:hotkeys-updated", this.hotkeys);
    }

    private registerAllHotkeys() {
        if (this.hotkeys == null) {
            return;
        }

        this.hotkeys.filter(h => h.active).forEach((k) => {
            this.registerHotkey(k.code);
        });
    }

    private registerHotkey(accelerator: Electron.Accelerator) {
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

    private runHotkey(code: Electron.Accelerator) {
        const hotkey = this.hotkeys.find(k => k.code === code);

        const effects = hotkey.effects;

        if (effects == null) {
            return;
        }

        const processEffectsRequest = {
            trigger: {
                type: TriggerType.HOTKEY,
                metadata: {
                    username: accountAccess.getAccounts().streamer.username,
                    hotkey: hotkey
                }
            },
            effects: effects
        };
        effectRunner.processEffects(processEffectsRequest);
    }
}

const hotkeyManager = new HotkeyManager();

export { hotkeyManager as HotkeyManager };