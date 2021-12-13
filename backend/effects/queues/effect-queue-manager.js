"use strict";

const logger = require("../../logwrapper");
const profileManager = require("../../common/profile-manager");
const frontendCommunicator = require("../../common/frontend-communicator");
let effectQueueRunner = require("./effect-queue-runner");

/**
 * @typedef SavedEffectQueue
 * @property {string} id - the id of the effect queue
 * @property {string} name - the name of the effect queue
 * @property {string} mode - the mode of the effect queue
 */


/**
 * @type {Object.<string, SavedEffectQueue>}
 */
let effectQueues = {};

const EFFECTS_FOLDER = "/effects/";
const getEffectQueuesDb = () => {
    return profileManager.getJsonDbInProfile(EFFECTS_FOLDER + "effectqueues");
};

const loadEffectQueues = () => {
    logger.debug(`Attempting to load effect queues...`);

    const queuesDb = getEffectQueuesDb();

    try {
        let effectQueueData = queuesDb.getData("/");

        if (effectQueueData) {
            effectQueues = effectQueueData;
        }

        logger.debug(`Loaded effect queues.`);

    } catch (err) {
        logger.warn(`There was an error reading effect queues file.`, err);
    }
};

/**
 * @param {SavedEffectQueue} effectQueue
 */
const saveEffectQueue = async (effectQueue) => {
    if (effectQueue == null) {
        return;
    }

    if (effectQueue.id != null) {
        effectQueues[effectQueue.id] = effectQueue;
    } else {
        const uuidv1 = require("uuid/v1");
        effectQueue.id = uuidv1();
        effectQueues[effectQueue.id] = effectQueue;
    }

    try {
        const effectQueuesDb = getEffectQueuesDb();

        effectQueuesDb.push("/" + effectQueue.id, effectQueue);

        logger.debug(`Saved effect queue ${effectQueue.id} to file.`);
        effectQueueRunner.updateQueueConfig(effectQueue);

        return effectQueue;
    } catch (err) {
        logger.warn(`There was an error saving an effect queue.`, err);
        return null;
    }
};

/**
 *
 * @param {SavedEffectQueue[]} allEffectQueues
 */
const saveAllEffectQueues = async(allEffectQueues) => {
    /** @type {Record<string,SavedEffectQueue>} */
    const effectQueuesObject = allEffectQueues.reduce((acc, current) => {
        acc[current.id] = current;
        return acc;
    }, {});

    effectQueues = effectQueuesObject;

    try {
        const effectQueueDb = getEffectQueuesDb();

        effectQueueDb.push("/", effectQueues);

        logger.debug(`Saved all effect queues to file.`);

    } catch (err) {
        logger.warn(`There was an error saving all effect queues.`, err);
        return null;
    }
};

const deleteEffectQueue = (queueId) => {
    if (queueId == null) {
        return;
    }

    delete effectQueues[queueId];

    try {
        const queuesDb = getEffectQueuesDb();

        queuesDb.delete("/" + queueId);

        logger.debug(`Deleted effect queue: ${queueId}`);

    } catch (err) {
        logger.warn(`There was an error deleting an effect queue.`, err);
    }

    effectQueueRunner.removeQueue(queueId);
};

const getEffectQueue = (queueId) => {
    if (queueId == null) {
        return null;
    }
    return effectQueues[queueId];
};

const triggerUiRefresh = () => {
    frontendCommunicator.send("all-queues", effectQueues);
};

frontendCommunicator.onAsync("getEffectQueues", async () => effectQueues);

frontendCommunicator.onAsync("saveEffectQueue",
    (/** @type {SavedEffectQueue} */ effectQueue) => saveEffectQueue(effectQueue));

frontendCommunicator.onAsync("saveAllEffectQueues",
    async (/** @type {SavedEffectQueue[]} */ allEffectQueues) => {
        saveAllEffectQueues(allEffectQueues);
    }
);

frontendCommunicator.on("deleteEffectQueue", (queueId) => {
    deleteEffectQueue(queueId);
});



exports.loadEffectQueues = loadEffectQueues;
exports.getEffectQueue = getEffectQueue;
exports.saveEffectQueue = saveEffectQueue;
exports.deleteEffectQueue = deleteEffectQueue;
exports.triggerUiRefresh = triggerUiRefresh;
