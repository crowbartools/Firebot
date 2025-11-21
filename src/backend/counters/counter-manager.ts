import fsp from "fs/promises";
import path from "path";
import sanitizeFileName from "sanitize-filename";

import type { Counter } from "../../types/counters";
import type { EffectList } from "../../types/effects";
import type { Trigger } from "../../types/triggers";
import type { CounterDisplayWidgetConfig } from "../overlay-widgets/builtin-types/counter-display/counter-display-types";

import { AccountAccess } from "../common/account-access";
import { ProfileManager } from "../common/profile-manager";
import JsonDbManager from "../database/json-db-manager";
import effectRunner from "../common/effect-runner";
import overlayWidgetConfigManager from "../overlay-widgets/overlay-widget-config-manager";
import frontendCommunicator from "../common/frontend-communicator";
import logger from "../logwrapper";

class CounterManager extends JsonDbManager<Counter> {
    constructor() {
        super("Counter", "/counters/counters");

        frontendCommunicator.on("counters:get-counters",
            () => this.getAllItems());

        frontendCommunicator.on("counters:save-counter",
            (counter: Counter) => this.saveItem(counter));

        frontendCommunicator.on("counters:save-all-counters",
            (allCounters: Counter[]) => this.saveAllItems(allCounters));

        frontendCommunicator.on("counters:delete-counter",
            (counterId: string) => this.deleteItem(counterId));

        frontendCommunicator.on("counters:get-counter-file-path",
            (counterName: string) => this.getCounterTxtFilePath(counterName));
    }

    /**
     * @deprecated Please use {@linkcode getItem()} instead.
     */
    getCounter(counterId: string): Counter {
        return this.getItem(counterId);
    }

    /**
     * @deprecated Please use {@linkcode getItemByName()} instead.
     */
    getCounterByName(counterName: string): Counter {
        return this.getItemByName(counterName);
    }

    override saveItem(counter: Counter): Counter {
        void this.updateCounterTxtFile(counter.name, counter.value);

        const savedCounter = super.saveItem(counter);

        this._updateCounterWidgets(savedCounter);

        return savedCounter;
    }

    override deleteItem(counterId: string): boolean {
        const counter = this.getItem(counterId);

        const result = super.deleteItem(counterId);
        if (result === true) {
            void this.deleteCounterTxtFile(counter.name);
        }

        return result;
    }

    private _updateCounterWidgets(counter: Counter): void {
        const counterWidgets = overlayWidgetConfigManager.getConfigsOfType<CounterDisplayWidgetConfig>("firebot:counter-display");

        for (const widget of counterWidgets) {
            if (widget.settings.counterId === counter.id) {
                overlayWidgetConfigManager.setWidgetStateById(widget.id, {
                    counterName: counter.name,
                    counterValue: counter.value
                }, false);
            }
        }
    }

    triggerUiRefresh(): void {
        frontendCommunicator.send("counters:all-counters-updated", this.getAllItems());
    }

    createCounter(counterName: string): Counter {
        const counter = {
            name: counterName,
            value: 0,
            saveToTxtFile: false
        };

        return this.saveItem(counter);
    }

    getCounterTxtFilePath(counterName: string): string {
        const folder = ProfileManager.getPathInProfile("/counters/");
        const sanitizedCounterName = sanitizeFileName(counterName);

        return path.join(folder, `${sanitizedCounterName}.txt`) || "";
    }

    async updateCounterTxtFile(counterName: string, counterValue: number): Promise<void> {
        if (counterName == null || isNaN(counterValue)) {
            return;
        }

        try {
            const txtFilePath = this.getCounterTxtFilePath(counterName);
            return await fsp.writeFile(txtFilePath, counterValue.toString(), { encoding: "utf8" });
        } catch (err) {
            logger.error("There was an error updating the counter text file", err);
            return;
        }
    }

    async renameCounterTxtFile(oldName: string, newName: string): Promise<void> {
        if (oldName == null || newName == null) {
            return;
        }

        try {
            const oldTxtFilePath = this.getCounterTxtFilePath(oldName);
            const newTxtFilePath = this.getCounterTxtFilePath(newName);

            return await fsp.rename(oldTxtFilePath, newTxtFilePath);
        } catch (err) {
            logger.error("There was an error renaming the counter text file", err);
            return;
        }
    }

    async deleteCounterTxtFile(counterName: string): Promise<void> {
        if (counterName == null) {
            return;
        }

        try {
            const txtFilePath = this.getCounterTxtFilePath(counterName);
            const fileExists = await (fsp.stat(txtFilePath).catch(() => false));

            if (fileExists) {
                return fsp.unlink(txtFilePath);
            }

            logger.warn(`Failed to delete counter "${counterName}" text file: the file doesn't exist.`);
        } catch (err) {
            logger.error("There was an error deleting the counter text file", err);
            return;
        }
    }

    private _counterHitMin(counter: Counter, value: number): boolean {
        if (counter.minimum == null) {
            return false;
        }

        if (value <= counter.minimum) {
            return true;
        }

        return false;
    }

    private _counterHitMax(counter: Counter, value: number): boolean {
        if (counter.maximum == null) {
            return false;
        }

        if (value >= counter.maximum) {
            return true;
        }

        return false;
    }

    private _runEffects(counter: Counter, effects: EffectList, previousValue?: number): void {
        const processEffectsRequest = {
            trigger: {
                type: "counter",
                metadata: {
                    username: AccountAccess.getAccounts().streamer.username,
                    counter: {
                        id: counter.id,
                        name: counter.name,
                        value: counter.value,
                        previousValue: previousValue,
                        minimum: counter.minimum,
                        maximum: counter.maximum
                    }
                }
            } as Trigger,
            effects: effects
        };
        void effectRunner.processEffects(processEffectsRequest);
    }

    private async _updateCounter(counter: Counter): Promise<void> {
        this.saveItem(counter);

        await this.updateCounterTxtFile(counter.name, counter.value);

        this._updateCounterWidgets(counter);

        frontendCommunicator.send("counters:counter-updated", counter);
    }

    async updateCounterValue(counterId: string, value: string | number, overridePreviousValue = false): Promise<void> {
        if (counterId == null || (typeof value === "number" && isNaN(value))) {
            logger.warn(`Failed to update counter, invalid values: ${counterId}, ${value}`);
            return;
        }

        const counter = this.getItem(counterId);
        let newValue = typeof value === "number" ? value : parseInt(value);

        if (!overridePreviousValue) {
            newValue = counter.value + newValue;
        }

        let effects: EffectList;
        if (this._counterHitMin(counter, newValue)) {
            newValue = counter.minimum;
            effects = counter.minimumEffects;

        } else if (this._counterHitMax(counter, newValue)) {
            newValue = counter.maximum;
            effects = counter.maximumEffects;

        } else {
            effects = counter.updateEffects;
        }

        if (newValue !== counter.value) {
            const previousValue = counter.value;
            counter.value = newValue;
            await this._updateCounter(counter);

            this._runEffects(counter, effects, previousValue);
        }
    }
}

const counterManager = new CounterManager();

export { counterManager as CounterManager };