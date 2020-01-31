"use strict";
const logger = require("../../logwrapper");
const effectRunner = require("../../common/effect-runner");

class EffectQueue {
    constructor(id, mode, interval = 10) {
        this.id = id;
        this.mode = mode;
        this.interval = interval;
        this._queue = [];
        this._running = false;
        this.canceled = false;
    }

    runQueue() {
        return new Promise(resolve => {
            if (this._queue.length === 0 || this.canceled) {
                return resolve();
            }

            let runEffectsContext = this._queue.shift();

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
                    .then(() => {
                        resolve(this.runQueue());
                    })
                    .catch(err => {
                        logger.warn(`Error while processing effects for queue ${this.id}`, err);
                        resolve(this.runQueue());
                    });
            } else {
                resolve();
            }
        });
    }

    addEffects(runEffectsContext) {
        this._queue.push(runEffectsContext);

        logger.debug(`Added more effects to queue ${this.id}. Current length=${this._queue.length}`);

        if (!this._running) {
            logger.debug(`Queue ${this.id} is idle... spinning up.`);
            this._running = true;
            this.runQueue().then(() => {
                logger.debug(`Queue ${this.id} is cleared... going idle.`);
                this._running = false;
            });
        }
    }
}

/**
 * @type {Object.<string, EffectQueue>}
 */
let queues = {};

function addEffectsToQueue(queueConfig, runEffectsContext) {
    if (queueConfig == null || runEffectsContext == null) return;
    let queue = queues[queueConfig.id];
    if (queue == null) {
        logger.debug(`Creating queue ${queueConfig.id}...`);
        queue = new EffectQueue(queueConfig.id, queueConfig.mode, queueConfig.interval);
        queues[queueConfig.id] = queue;
    }

    queue.addEffects(runEffectsContext);
}

function updateQueueConfig(queueConfig) {
    if (queueConfig == null) return;
    let queue = queues[queueConfig.id];
    if (queue != null) {
        queue.mode = queueConfig.mode;
        queue.interval = queueConfig.interval;
    }
}

function removeQueue(queueId) {
    if (queueId == null) return;
    let queue = queues[queueId];

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
exports.removeQueue = removeQueue;
exports.clearAllQueues = clearAllQueues;


