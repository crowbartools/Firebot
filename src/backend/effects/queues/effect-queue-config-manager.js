"use strict";

const frontendCommunicator = require("../../common/frontend-communicator");
const JsonDbManager = require("../../database/json-db-manager");
const effectQueueRunner = require("./effect-queue-runner").default;

/**
 * @typedef EffectQueueConfig
 * @prop {string} id - the id of the effect queue
 * @prop {string} name - the name of the effect queue
 * @prop {string} mode - the mode of the effect queue
 * @prop {number} [interval] - the interval set for the interval mode
 * @prop {string[]} sortTags - the tags for the effect queue
 * @prop {boolean} active - the effect queue activity status
 * @prop {number} length - amount of items currently in queue. don't save
 * @prop {any[]} queue - effects queue. don't save
 */

/**
 * @extends {JsonDbManager<EffectQueueConfig>}
 * {@link JsonDbManager}
 * @hideconstructor
 */
class EffectQueueConfigManager extends JsonDbManager {
    constructor() {
        super("Effect Queue", "/effects/effectqueues");
    }

    /**
     * @override
     * @returns {void}
     */
    loadItems() {
        super.loadItems();
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
     * @param {EffectQueueConfig} effectQueueConfig
     * @returns {EffectQueueConfig | null}
     * */
    saveItem(effectQueueConfig) {
        delete effectQueueConfig.length;
        delete effectQueueConfig.queue;
        const savedEffectQueueConfig = super.saveItem(effectQueueConfig);

        if (savedEffectQueueConfig) {
            effectQueueRunner.updateQueue(savedEffectQueueConfig);
            return savedEffectQueueConfig;
        }

        return null;
    }

    /**
     * @override
     * @param allItems - array of all effect queues
     */
    saveAllItems(allItems) {
        for (const item of allItems) {
            delete item.length;
            delete item.queue;
        }
        super.saveAllItems(allItems);
    }

    /**
     * @override
     * @returns {EffectQueueConfig[]}
     */
    getAllItems() {
        const items = JSON.parse(JSON.stringify(super.getAllItems()));
        for (const item of items) {
            item.length = effectQueueRunner.getQueueLength(item.id);
        }
        return items;
    }

    /**
     * @override
     * @param itemId
     * @returns {EffectQueueConfig | null}
     */
    getItem(itemId) {
        const item = JSON.parse(JSON.stringify(super.getItem(itemId)));

        if (item == null) {
            return null;
        }

        item.length = effectQueueRunner.getQueueLength(itemId);

        return item;
    }

    /**
     * @returns {void}
     */
    triggerUiRefresh() {
        frontendCommunicator.send("all-queues", this.getAllItems());
    }

    /** @private */
    setQueueActiveStatus(queue, status) {
        queue.active = status;
        this.saveItem(queue);
        frontendCommunicator.send("updateQueueStatus", {id: queue.id, active: status});
    }

    pauseQueue(queueId) {
        const queue = this.getItem(queueId);
        if (queue != null && queue.active) {
            this.setQueueActiveStatus(queue, false);
        }
    }

    resumeQueue(queueId) {
        const queue = this.getItem(queueId);
        if (queue != null && !queue.active) {
            this.setQueueActiveStatus(queue, true);
        }
    }

    toggleQueue(queueId) {
        const queue = this.getItem(queueId);
        if (queue != null) {
            this.setQueueActiveStatus(queue, !queue.active);
        }
    }
}

const effectQueueManager = new EffectQueueConfigManager();

frontendCommunicator.onAsync("getEffectQueues",
    async () => effectQueueManager.getAllItems());

frontendCommunicator.onAsync("saveEffectQueue",
    async (/** @type {EffectQueueConfig} */ effectQueue) => effectQueueManager.saveItem(effectQueue));

frontendCommunicator.onAsync("saveAllEffectQueues",
    async (/** @type {EffectQueueConfig[]} */ allEffectQueues) => effectQueueManager.saveAllItems(allEffectQueues));

frontendCommunicator.on("deleteEffectQueue",
    (/** @type {string} */ effectQueueId) => effectQueueManager.deleteItem(effectQueueId));

frontendCommunicator.on("clearEffectQueue",
    (/** @type {string} */ effectQueueId) => effectQueueRunner.removeQueue(effectQueueId));

frontendCommunicator.on("toggleEffectQueue",
    (/** @type {string} */ effectQueueId) => effectQueueManager.toggleQueue(effectQueueId));

module.exports = effectQueueManager;
