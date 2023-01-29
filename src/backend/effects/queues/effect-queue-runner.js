"use strict";
const logger = require("../../logwrapper");
const effectRunner = require("../../common/effect-runner");

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
    constructor(id, mode, interval = 0) {
        this.id = id;
        this.mode = mode;
        this.interval = interval;

        /**
         * @type {QueueEntry[]}
         */
        this._queue = [];
        this._running = false;
        this._paused = false;
        this.canceled = false;
    }

    runQueue() {
        return new Promise(resolve => {
            if (this._queue.length === 0 || this.canceled || this._paused === true) {
                return resolve();
            }

            const { runEffectsContext, duration } = this._queue.shift();

            if (runEffectsContext == null) {
                return resolve();
            }

            logger.debug(`Running next effects for queue ${this.id}. Mode=${this.mode}, Interval?=${this.interval}, Remaining queue length=${this._queue.length}`);

            if (this.mode === "interval") {
                effectRunner.runEffects(runEffectsContext)
                    .catch(err => {
                        logger.warn(`Error while processing effects for queue ${this.id}`, err);
                    });
                setTimeout(() => {
                    resolve(this.runQueue());
                }, this.interval * 1000);
            } else if (this.mode === "auto") {
                effectRunner.runEffects(runEffectsContext)
                    .catch(err => {
                        logger.warn(`Error while processing effects for queue ${this.id}`, err);
                    })
                    .finally(() => {
                        setTimeout(() => {
                            resolve(this.runQueue());
                        }, (this.interval ?? 0) * 1000);
                    });
            } else if (this.mode === "custom") {
                effectRunner.runEffects(runEffectsContext)
                    .catch(err => {
                        logger.warn(`Error while processing effects for queue ${this.id}`, err);
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
                });
            }
        }
    }

    pauseQueue() {
        logger.debug(`Pausing queue ${this.id}...`);
        this._paused = true;
    }

    resumeQueue() {
        logger.debug(`Resuming queue ${this.id}...`);
        this._paused = false;
        this.processEffectQueue();
    }

    toggleQueue() {
        if (this._paused) {
            this.resumeQueue();
        } else {
            this.pauseQueue();
        }
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
        queue = new EffectQueue(queueConfig.id, queueConfig.mode, queueConfig.interval);
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
    }
}

function pauseQueue(queueId) {
    const queue = queues[queueId];
    if (queue != null) {
        queue.pauseQueue();
    }
}

function resumeQueue(queueId) {
    const queue = queues[queueId];
    if (queue != null) {
        queue.resumeQueue();
    }
}

function toggleQueue(queueId) {
    const queue = queues[queueId];
    if (queue != null) {
        queue.toggleQueue();
    }
}

function removeQueue(queueId) {
    if (queueId == null) {
        return;
    }
    const queue = queues[queueId];

    if (queue != null) {
        logger.debug(`Removing queue ${queue.id}`);
        queue.canceled = true;
        delete queues[queueId];
    }
}

function clearAllQueues() {
    Object.keys(queues).forEach(queueId => removeQueue(queueId));
}

exports.addEffectsToQueue = addEffectsToQueue;
exports.updateQueueConfig = updateQueueConfig;
exports.pauseQueue = pauseQueue;
exports.resumeQueue = resumeQueue;
exports.toggleQueue = toggleQueue;
exports.removeQueue = removeQueue;
exports.clearAllQueues = clearAllQueues;
