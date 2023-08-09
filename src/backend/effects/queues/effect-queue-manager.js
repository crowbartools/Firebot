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
 * @prop {string[]} sortTags - the tags for the effect queue
 * @prop {boolean} active - the effect queue activity status
 */

/**
 * @extends {JsonDbManager<EffectQueue>}
 * {@link JsonDbManager}
 * @hideconstructor
 */
class EffectQueueManager extends JsonDbManager {
    constructor() {
        super("Effect Queue", "/effects/effectqueues");
    }

    /**
     * @override
     * @returns {void}
     */
    loadItems() {
        super.loadItems();
        /** @type {EffectQueue[]} */
        const queues = this.getAllItems();

        let save = false;

        for (const queue of queues) {
            if (queue.active == null) {
                queue.active = true;
                save = true;
            }
        }
        if (save) {
            this.saveAllItems(queues);
        }
    }

    /**
     * @override
     * @param {EffectQueue} effectQueue
     * @returns {EffectQueue | null}
     * */
    saveItem(effectQueue) {
        const savedEffectQueue = super.saveItem(effectQueue);

        if (savedEffectQueue) {
            effectQueueRunner.updateQueueConfig(savedEffectQueue);
            return savedEffectQueue;
        }

        return null;
    }

    /**
     * @returns {void}
     */
    triggerUiRefresh() {
        frontendCommunicator.send("all-queues", this.getAllItems());
    }

    /** @private */
    setQueueActivity(queue, status) {
        queue.active = status;
        this.saveItem(queue);
        frontendCommunicator.send("updateQueueStatus", {id: queue.id, active: status});
    }

    pauseQueue(queueId) {
        const queue = this.getItem(queueId);
        if (queue != null && queue.active) {
            this.setQueueActivity(queue, false);
        }
    }

    resumeQueue(queueId) {
        const queue = this.getItem(queueId);
        if (queue != null && !queue.active) {
            this.setQueueActivity(queue, true);
        }
    }

    toggleQueue(queueId) {
        const queue = this.getItem(queueId);
        if (queue != null) {
            this.setQueueActivity(queue, !queue.active);
        }
    }
}

const effectQueueManager = new EffectQueueManager();

frontendCommunicator.onAsync("getEffectQueues",
    async () => effectQueueManager.getAllItems());

frontendCommunicator.onAsync("saveEffectQueue",
    async (/** @type {EffectQueue} */ effectQueue) => effectQueueManager.saveItem(effectQueue));

frontendCommunicator.onAsync("saveAllEffectQueues",
    async (/** @type {EffectQueue[]} */ allEffectQueues) => effectQueueManager.saveAllItems(allEffectQueues));

frontendCommunicator.on("deleteEffectQueue",
    (/** @type {string} */ effectQueueId) => effectQueueManager.deleteItem(effectQueueId));

frontendCommunicator.on("clearEffectQueue",
    (/** @type {string} */ effectQueueId) => effectQueueRunner.removeQueue(effectQueueId));

frontendCommunicator.on("toggleEffectQueue",
    (/** @type {string} */ effectQueueId) => effectQueueManager.toggleQueue(effectQueueId));

module.exports = effectQueueManager;
