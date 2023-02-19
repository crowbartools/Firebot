"use strict";

const frontendCommunicator = require("../common/frontend-communicator");
const JsonDbManager = require("../database/json-db-manager");
const profileManager = require("../common/profile-manager.js");
const fs = require("fs-extra");
const path = require("path");
const sanitizeFileName = require("sanitize-filename");
const logger = require("../logwrapper");
const { TriggerType } = require("../common/EffectType");
const accountAccess = require("../common/account-access");
const effectRunner = require("../common/effect-runner");

/**
 * @typedef Counter
 * @prop {string} id - the id of the counter
 * @prop {string} name - the name of the counter
 * @prop {number} value - the value of the counter
 * @prop {boolean} saveToTxtFile - whether the value of the counter should be saved in a text file
 * @prop {number} [minimum] - the minimum value the counter can be
 * @prop {number} [maximum] - the maximum value the counter can be
 * @prop {import("../../types/effects").EffectList} [updateEffects] - the effect list that is triggered when the counter is updated
 * @prop {import("../../types/effects").EffectList} [minimumEffects] - the effect list that is triggered when the minimum value is hit
 * @prop {import("../../types/effects").EffectList} [maximumEffects] - the effect list that is triggered when the maximum value is hit
 */

/**
 * @extends {JsonDbManager<Counter>}
 * {@link JsonDbManager}
 * @hideconstructor
 */
class CounterManager extends JsonDbManager {
    constructor() {
        super("Counter", "/counters/counters");
    }

    /**
     * @deprecated Please use loadItems() instead.
     *
     * @returns {void}
     */
    loadCounters() {
        this.loadItems();
    }

    /**
     * @deprecated Please use saveItem() instead.
     *
     * @param {Counter} counter
     * @returns {Promise.<Counter>}
     */
    async saveCounter(counter) {
        const savedCounter = await this.saveItem(counter);

        if (savedCounter) {
            return savedCounter;
        }

        return {};
    }

    /**
     * @deprecated Please use deleteItem() instead.
     *
     * @param {Counter} counterId
     * @returns {void}
     */
    async deleteCounter(counterId) {
        this.deleteItem(counterId);
    }

    /**
     * @deprecated Please use getItem() instead.
     *
     * @param {string} counterId
     * @returns {Counter}
     */
    getCounter(counterId) {
        return this.getItem(counterId);
    }

    /**
     * @deprecated Please use getItemByName() instead.
     *
     * @param {string} counterName
     * @returns {Counter}
     */
    getCounterByName(counterName) {
        return this.getItemByName(counterName);
    }

    /**
     * @override
     * @param {Counter} counter
     * @returns {Promise.<Counter>}
     */
    async saveItem(counter) {
        await this.updateCounterTxtFile(counter.name, counter.value);

        return super.saveItem(counter);
    }

    /**
     * @override
     * @param {string} counterId
     * @returns {Promise.<void>}
     */
    async deleteItem(counterId) {
        const counter = this.getItem(counterId);

        super.deleteItem(counterId);
        await this.deleteCounterTxtFile(counter.name);
    }

    /**
     * @returns {void}
     */
    triggerUiRefresh() {
        frontendCommunicator.send("all-counters", this.getAllItems());
    }

    /**
     * @param {string} counterName
     * @returns {Promise.<Counter>}
     */
    createCounter(counterName) {
        const counter = {
            name: counterName,
            value: 0,
            saveToTxtFile: false
        };

        return this.saveItem(counter);
    }

    /**
     * @param {string} counterName
     * @returns {string}
     */
    getCounterTxtFilePath(counterName) {
        const folder = profileManager.getPathInProfile("/counters/");
        const sanitizedCounterName = sanitizeFileName(counterName);

        return path.join(folder, `${sanitizedCounterName}.txt`) || "";
    }

    /**
     * @param {string} counterName
     * @param {number} counterValue
     * @returns {Promise.<void>}
     */
    updateCounterTxtFile(counterName, counterValue) {
        if (counterName == null || isNaN(counterValue)) {
            return;
        }

        try {
            const txtFilePath = this.getCounterTxtFilePath(counterName);
            return fs.writeFile(txtFilePath, counterValue.toString(), 'utf8');
        } catch (err) {
            logger.error("There was an error updating the counter text file", err);
            return;
        }
    }

    /**
     * @param {string} oldName
     * @param {string} newName
     * @returns {void}
     */
    renameCounterTxtFile(oldName, newName) {
        if (oldName == null || newName == null) {
            return;
        }

        try {
            const oldTxtFilePath = this.getCounterTxtFilePath(oldName);
            const newTxtFilePath = this.getCounterTxtFilePath(newName);

            return fs.rename(oldTxtFilePath, newTxtFilePath);
        } catch (err) {
            logger.error("There was an error renaming the counter text file", err);
            return;
        }
    }

    /**
     * @param {string} counterName
     * @returns {Promise.<void>}
     */
    async deleteCounterTxtFile(counterName) {
        if (counterName == null) {
            return;
        }

        try {
            const txtFilePath = this.getCounterTxtFilePath(counterName);
            const fileExists = await fs.pathExists(txtFilePath);

            if (fileExists) {
                return fs.unlink(txtFilePath);
            }

            logger.warn("Failed to delete counter text file: the file doesn't exist.", {location: "/counters/counter-manager.js:117"});
        } catch (err) {
            logger.error("There was an error deleting the counter text file", err);
            return;
        }
    }

    /**
     * @private
     * @param {Counter} counter
     * @param {number} value
     * @returns {boolean}
     */
    _counterHitMin(counter, value) {
        if (counter.minimum == null) {
            return false;
        }

        if (value <= counter.minimum) {
            return true;
        }

        return false;
    }

    /**
     * @private
     * @param {Counter} counter
     * @param {number} value
     * @returns {boolean}
     */
    _counterHitMax(counter, value) {
        if (counter.maximum == null) {
            return false;
        }

        if (value >= counter.maximum) {
            return true;
        }

        return false;
    }

    /**
     * @private
     * @param {Counter} counter
     * @param {import("../../types/effects").EffectList} effects
     * @returns {Promise.<void>}
     */
    _runEffects(counter, effects) {
        const processEffectsRequest = {
            trigger: {
                type: TriggerType.COUNTER,
                metadata: {
                    username: accountAccess.getAccounts().streamer.username,
                    counter: {
                        id: counter.id,
                        name: counter.name,
                        value: counter.value,
                        minimum: counter.minimum,
                        maximum: counter.maximum
                    }
                }
            },
            effects: effects
        };
        effectRunner.processEffects(processEffectsRequest);
    }

    /**
     * @private
     * @param {Counter} counter
     * @returns {Promise<void>}
     */
    async _updateCounter(counter) {
        this.saveItem(counter);

        await this.updateCounterTxtFile(counter.name, counter.value);

        frontendCommunicator.send("counter-update", counter);
    }

    /**
     * @param {string} counterId
     * @param {number} value
     * @param {number} overridePreviousValue
     * @returns {Promise.<void>}
     */
    async updateCounterValue(counterId, value, overridePreviousValue = false) {
        if (counterId == null || isNaN(value)) {
            logger.warn(`Failed to update counter, invalid values: ${counterId}, ${value}`, {location: "/counters/counter-manager:126"});
            return;
        }

        const counter = this.getItem(counterId);
        let newValue = parseInt(value);

        if (!overridePreviousValue) {
            newValue = counter.value + newValue;
        }

        let effects = {};
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
            counter.value = newValue;
            await this._updateCounter(counter);

            this._runEffects(counter, effects);
        }
    }
}


const counterManager = new CounterManager();

frontendCommunicator.onAsync("getCounters",
    async () => counterManager.getAllItems());

frontendCommunicator.onAsync("saveCounter",
    async (/** @type {Counter} */ counter) => counterManager.saveItem(counter));

frontendCommunicator.onAsync("saveAllCounters",
    async (/** @type {Counter[]} */ allCounters) => counterManager.saveAllItems(allCounters));

frontendCommunicator.on("deleteCounter",
    (/** @type {string} */ counterId) => counterManager.deleteItem(counterId));

module.exports = counterManager;
