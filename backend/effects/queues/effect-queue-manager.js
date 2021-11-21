"use strict";

const logger = require("../../logwrapper");
const profileManager = require("../../common/profile-manager");
const frontendCommunicator = require("../../common/frontend-communicator");

let effectQueueRunner = require("./effect-queue-runner");

let effectQueues = {};

const EFFECTS_FOLDER = "/effects/";
function getEffectQueuesDb() {
    return profileManager.getJsonDbInProfile(EFFECTS_FOLDER + "effectqueues");
}

/*
{
    "queueId": {
        name: "Some Queue",
        id: "queueId",
        mode: "",  // "auto" | "interval" | "custom"
        interval: 5 //secs
    }
}
*/

function loadEffectQueues() {
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
}

function saveEffectQueue(queue) {
    if (queue == null) {
        return;
    }

    effectQueues[queue.id] = queue;

    try {
        const queuesDb = getEffectQueuesDb();

        queuesDb.push("/" + queue.id, queue);

        logger.debug(`Saved effect queue ${queue.id} to file.`);

    } catch (err) {
        logger.warn(`There was an error saving an effect queue.`, err);
    }

    effectQueueRunner.updateQueueConfig(queue);
}

function deleteEffectQueue(queueId) {
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
}

function getEffectQueue(queueId) {
    if (queueId == null) {
        return null;
    }
    return effectQueues[queueId];
}

function triggerUiRefresh() {
    frontendCommunicator.send("all-queues", effectQueues);
}

frontendCommunicator.onAsync("getEffectQueues", async () => effectQueues);

frontendCommunicator.on("saveEffectQueue", (queue) => {
    saveEffectQueue(queue);
});

frontendCommunicator.on("deleteEffectQueue", (queueId) => {
    deleteEffectQueue(queueId);
});



exports.loadEffectQueues = loadEffectQueues;
exports.getEffectQueue = getEffectQueue;
exports.saveEffectQueue = saveEffectQueue;
exports.deleteEffectQueue = deleteEffectQueue;
exports.triggerUiRefresh = triggerUiRefresh;
