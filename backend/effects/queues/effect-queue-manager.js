"use strict";

const frontendCommunicator = require("../../common/frontend-communicator");
const JsonDbManager = require("../../database/json-db-manager");

/**
 * @typedef SavedEffectQueue
 * @property {string} id - the id of the effect queue
 * @property {string} name - the name of the effect queue
 * @property {string} mode - the mode of the effect queue
 * @property {number} [interval] - the interval set for the interval mode
 * @property {string[]} sortTags - the sort tags for the effect queue
 */

/**
 * @extends {JsonDbManager<SavedPresetEffectList>}
 */
class EffectQueueManager extends JsonDbManager {
    constructor() {
        super("Effect Queue", "/effects/effectqueues");
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
