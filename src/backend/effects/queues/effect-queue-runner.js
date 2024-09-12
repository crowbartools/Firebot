"use strict";
const logger = require("../../logwrapper");
const effectRunner = require("../../common/effect-runner");
const eventManager = require("../../events/EventManager");
const frontendCommunicator = require("../../common/frontend-communicator");
const EventEmitter = require("events");
const { abortEffectList } = require("../../common/effect-abort-helpers");


/**
 * Queue Entry
 * @typedef {Object} QueueEntry
 * @property {Object} runEffectsContext
 * @property {number} [duration]
 * @property {"none" | "high"} [priority]
 */

/**
 * Effect queue class
 */
class EffectQueue {
    constructor(id, mode, interval = 0, active = true) {
        this.id = id;
        this.mode = mode;
        this.interval = interval;

        /**
         * @type {QueueEntry[]}
         */
        this._queue = [];
        this._running = false;
        this._paused = !active;

        /**
         * The effect list(s) that are currently being processed by the effect runner
         * @type {string[]}
         */
        this._activeEffectListIds = [];

        this.canceled = false;
    }

    sendQueueLengthUpdate(lengthOverride = null) {
        const queue = {
            id: this.id,
            length: lengthOverride ?? this._queue.length
        };

        frontendCommunicator.send("updateQueueLength", queue);

        exports.events.emit("length-updated", queue);
    }

    _addActiveEffectListId(effectListId) {
        if (effectListId) {
            this._activeEffectListIds.push(effectListId);
        }
    }

    _removeActiveEffectListId(effectListId) {
        const index = this._activeEffectListIds.indexOf(effectListId);
        if (index > -1) {
            this._activeEffectListIds.splice(index, 1);
        }
    }

    runQueue() {
        return new Promise((resolve) => {
            if (this._queue.length === 0 || this.canceled || this._paused === true) {
                return resolve();
            }

            const { runEffectsContext, duration } = this._queue.shift();

            if (runEffectsContext == null) {
                return resolve();
            }

            logger.debug(`Running next effects for queue ${this.id}. Mode=${this.mode}, Interval?=${this.interval}, Remaining queue length=${this._queue.length}`);

            this.sendQueueLengthUpdate();

            if (this.mode === "interval") {
                this._addActiveEffectListId(runEffectsContext.effects?.id);
                effectRunner.runEffects(runEffectsContext)
                    .catch((err) => {
                        logger.warn(`Error while processing effects for queue ${this.id}`, err);
                    })
                    .finally(() => {
                        this._removeActiveEffectListId(runEffectsContext.effects?.id);
                    });
                setTimeout(() => {
                    resolve(this.runQueue());
                }, this.interval * 1000);
            } else if (this.mode === "auto") {
                this._addActiveEffectListId(runEffectsContext.effects?.id);
                effectRunner.runEffects(runEffectsContext)
                    .catch((err) => {
                        logger.warn(`Error while processing effects for queue ${this.id}`, err);
                    })
                    .finally(() => {
                        this._removeActiveEffectListId(runEffectsContext.effects?.id);
                        setTimeout(() => {
                            resolve(this.runQueue());
                        }, (this.interval ?? 0) * 1000);
                    });
            } else if (this.mode === "custom") {
                this._addActiveEffectListId(runEffectsContext.effects?.id);
                effectRunner.runEffects(runEffectsContext)
                    .catch((err) => {
                        logger.warn(`Error while processing effects for queue ${this.id}`, err);
                    })
                    .finally(() => {
                        this._removeActiveEffectListId(runEffectsContext.effects?.id);
                    });
                setTimeout(() => {
                    resolve(this.runQueue());
                }, (duration || 0) * 1000);
            } else {
                resolve();
            }
        });
    }

    addEffects(runEffectsContext, duration, priority) {
        const queueEntry = {
            runEffectsContext,
            duration,
            priority
        };

        if (priority === "high") {
            const firstNonPriority = this._queue.findIndex(entry => entry.priority !== "high");
            if (firstNonPriority > -1) {
                this._queue.splice(firstNonPriority, 0, queueEntry);
            } else {
                this._queue.push(queueEntry);
            }
        } else {
            this._queue.push(queueEntry);
        }

        logger.debug(`Added more effects to queue ${this.id}. Current length=${this._queue.length}`);

        eventManager.triggerEvent("firebot", "effect-queue-added", {
            effectQueueId: this.id
        });

        this.sendQueueLengthUpdate();

        this.processEffectQueue();
    }

    processEffectQueue() {
        if (this._paused) {
            logger.debug(`Queue ${this.id} is paused. Will run effects once queue is resumed.`);
        } else {
            if (!this._running && this._queue.length > 0) {
                logger.debug(`Queue ${this.id} is idle... spinning up.`);
                this._running = true;
                this.runQueue().then(() => {
                    logger.debug(`Queue ${this.id} is ${this._paused && this._queue.length > 0 ? "paused" : "cleared"}... going idle.`);
                    this._running = false;
                    if (this._queue.length === 0) {
                        eventManager.triggerEvent("firebot", "effect-queue-cleared", {
                            effectQueueId: this.id
                        });
                    }
                });
            }
        }
    }

    pauseQueue() {
        logger.debug(`Pausing queue ${this.id}...`);

        eventManager.triggerEvent("firebot", "effect-queue-status", {
            effectQueueId: this.id
        });

        this._paused = true;
    }

    resumeQueue() {
        logger.debug(`Resuming queue ${this.id}...`);

        eventManager.triggerEvent("firebot", "effect-queue-status", {
            effectQueueId: this.id
        });

        this._paused = false;
        this.processEffectQueue();
    }
}

/**
 * @type {Object.<string, EffectQueue>}
 */
const queues = {};

function addEffectsToQueue(queueConfig, runEffectsContext, duration, priority) {
    if (queueConfig == null || runEffectsContext == null) {
        return;
    }
    let queue = queues[queueConfig.id];
    if (queue == null) {
        logger.debug(`Creating queue ${queueConfig.id}...`);
        queue = new EffectQueue(queueConfig.id, queueConfig.mode, queueConfig.interval, queueConfig.active);
        queues[queueConfig.id] = queue;
    }

    queue.addEffects(runEffectsContext, duration, priority);
}

function updateQueueConfig(queueConfig) {
    if (queueConfig == null) {
        return;
    }
    const queue = queues[queueConfig.id];
    if (queue != null) {
        queue.mode = queueConfig.mode;
        queue.interval = queueConfig.interval;
        if (queueConfig.active) {
            queue.resumeQueue();
        } else {
            queue.pauseQueue();
        }
    }
}

function removeQueue(queueId, abortActiveEffectLists = false) {
    if (queueId == null) {
        return;
    }
    const queue = queues[queueId];

    if (queue != null) {
        logger.debug(`Removing queue ${queue.id}`);
        queue.canceled = true;
        queue.sendQueueLengthUpdate(0);

        if (abortActiveEffectLists) {
            queue._activeEffectListIds.forEach((id) => {
                abortEffectList(id, true);
            });
            queue._activeEffectListIds = [];
        }

        delete queues[queueId];
    }
}

function getQueue(queueId) {
    const queue = queues[queueId];
    if (queue == null) {
        return [];
    }
    return queue._queue;
}

function clearAllQueues(abortActiveEffectLists = false) {
    Object.keys(queues).forEach(queueId => removeQueue(queueId, abortActiveEffectLists));
}

function abortActiveEffectListsForQueue(queueId, bubbleStop = true) {
    const queue = queues[queueId];
    if (queue != null) {
        queue._activeEffectListIds.forEach((id) => {
            abortEffectList(id, bubbleStop);
        });
        queue._activeEffectListIds = [];
    }
}

function abortActiveEffectListsForAllQueues(bubbleStop = true) {
    Object.keys(queues).forEach(queueId => abortActiveEffectListsForQueue(queueId, bubbleStop));
}
/**
 * @type {import("tiny-typed-emitter").TypedEmitter<{
*    "length-updated": (item: object) => void;
*  }>}
*/
exports.events = new EventEmitter();

exports.addEffectsToQueue = addEffectsToQueue;
exports.getQueue = getQueue;
exports.updateQueueConfig = updateQueueConfig;
exports.removeQueue = removeQueue;
exports.clearAllQueues = clearAllQueues;
exports.abortActiveEffectListsForQueue = abortActiveEffectListsForQueue;
exports.abortActiveEffectListsForAllQueues = abortActiveEffectListsForAllQueues;
