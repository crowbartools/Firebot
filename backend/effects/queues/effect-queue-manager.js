"use strict";

const frontendCommunicator = require("../../common/frontend-communicator");
const JsonDbManager = require("../../database/json-db-manager");
const effectQueueRunner = require("./effect-queue-runner");

/**
 * @typedef EffectQueue
 * @prop {string} id - the id of the effect queue
 * @prop {string} name - the name of the effect queue
 * @prop {string} mode - the mode of the effect queue
 * @prop {number} [interval] - the interval set for the interval mode
 * @prop {string[]} sortTags - the sort tags for the effect queue
 */

/**
 * @extends {JsonDbManager<EffectQueue>}
 */
class EffectQueueManager extends JsonDbManager {
    constructor() {
        super("Effect Queue", "/effects/effectqueues");
    }

    /**
     * @param {EffectQueue}
     * @returns {Promise.<EffectQueue | null>}
     * */
    async saveItem(effectQueue) {
        const savedEffectQueue = await super.saveItem(effectQueue);

        if (savedEffectQueue) {
            effectQueueRunner.updateQueueConfig(savedEffectQueue);
            return savedEffectQueue;
        }

        return null;
    }

    /**
     * @emits
     * @returns {void}
     */
    triggerUiRefresh() {
        frontendCommunicator.send("all-queues", this.getAllItems());
    }
}

const effectQueueManager = new EffectQueueManager();

frontendCommunicator.onAsync("getEffectQueues",
    async () => effectQueueManager.getAllItems());

frontendCommunicator.onAsync("saveEffectQueue",
    async (/** @type {SavedEffectQueue} */ effectQueue) => await effectQueueManager.saveItem(effectQueue));

frontendCommunicator.onAsync("saveAllEffectQueues",
    async (/** @type {SavedEffectQueue[]} */ allEffectQueues) => await effectQueueManager.saveAllItems(allEffectQueues));

frontendCommunicator.on("deleteEffectQueue",
    (/** @type {string} */ effectQueueId) => effectQueueManager.deleteItem(effectQueueId));

module.exports = effectQueueManager;
