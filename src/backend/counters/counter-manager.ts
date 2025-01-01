import fsp from "fs/promises";
import path from "path";
import sanitizeFileName from "sanitize-filename";
import logger from "../logwrapper";
import JsonDbManager from "../database/json-db-manager";
import frontendCommunicator from "../common/frontend-communicator";
import accountAccess from "../common/account-access";
import effectRunner from "../common/effect-runner";
import profileManager from "../common/profile-manager";
import { TriggerType } from "../common/EffectType";
import { Counter } from "../../types/counters";
import { EffectList } from "../../types/effects";

class CounterManager extends JsonDbManager<Counter> {
    constructor() {
        super("Counter", "/counters/counters");

        frontendCommunicator.onAsync("counters:get-counters",
            async () => this.getAllItems());

        frontendCommunicator.onAsync("counters:save-counter",
            async (counter: Counter) => this.saveItem(counter));

        frontendCommunicator.onAsync("counters:save-all-counters",
            async (allCounters: Counter[]) => this.saveAllItems(allCounters));

        frontendCommunicator.on("counters:delete-counter",
            (counterId: string) => this.deleteItem(counterId));

        frontendCommunicator.on("counters:get-counter-file-path",
            (counterName: string) => this.getCounterTxtFilePath(counterName));
    }

    /**
     * @deprecated Please use `loadItems()` instead.
     */
    loadCounters(): void {
        this.loadItems();
    }

    /**
     * @deprecated Please use `saveItem()` instead.
     */
    async saveCounter(counter: Counter): Promise<Counter | unknown> {
        const savedCounter = await this.saveItem(counter);

        if (savedCounter) {
            return savedCounter;
        }

        return {};
    }

    /**
     * @deprecated Please use `deleteItem()` instead.
     */
    deleteCounter(counterId: string): void {
        this.deleteItem(counterId);
    }

    /**
     * @deprecated Please use `getItem()` instead.
     */
    getCounter(counterId: string): Counter {
        return this.getItem(counterId);
    }

    /**
     * @deprecated Please use `getItemByName()` instead.
     */
    getCounterByName(counterName: string): Counter {
        return this.getItemByName(counterName);
    }

    override saveItem(counter: Counter): Counter {
        this.updateCounterTxtFile(counter.name, counter.value);

        return super.saveItem(counter);
    }

    override deleteItem(counterId: string): boolean {
        const counter = this.getItem(counterId);

        const result = super.deleteItem(counterId);
        if (result === true) {
            this.deleteCounterTxtFile(counter.name);
        }

        return result;
    }

    triggerUiRefresh(): void {
        frontendCommunicator.send("counters:all-counters-updated", this.getAllItems());
    }

    async createCounter(counterName: string): Promise<Counter> {
        const counter = {
            name: counterName,
            value: 0,
            saveToTxtFile: false
        };

        return this.saveItem(counter);
    }

    getCounterTxtFilePath(counterName: string): string {
        const folder = profileManager.getPathInProfile("/counters/");
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
                type: TriggerType.COUNTER,
                metadata: {
                    username: accountAccess.getAccounts().streamer.username,
                    counter: {
                        id: counter.id,
                        name: counter.name,
                        value: counter.value,
                        previousValue: previousValue,
                        minimum: counter.minimum,
                        maximum: counter.maximum
                    }
                }
            },
            effects: effects
        };
        effectRunner.processEffects(processEffectsRequest);
    }

    private async _updateCounter(counter: Counter): Promise<void> {
        this.saveItem(counter);

        await this.updateCounterTxtFile(counter.name, counter.value);

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