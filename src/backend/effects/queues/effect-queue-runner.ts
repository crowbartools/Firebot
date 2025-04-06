import { TypedEmitter } from "tiny-typed-emitter";
import { EffectQueue, RunEffectsContext } from "./effect-queue";
import logger from "../../logwrapper";
import type { EffectQueueConfig } from "./effect-queue-config-manager";

type Events = {
    "length-updated": (queueData: { id: string, length: number }) => void;
};

class EffectQueueRunner extends TypedEmitter<Events> {
    private _queues: Record<string, EffectQueue> = {};

    constructor() {
        super();
    }

    private _getQueue(queueConfig: EffectQueueConfig) {
        let queue = this._queues[queueConfig.id];
        if (queue == null) {
            logger.debug(`Creating queue ${queueConfig.id}...`);

            queue = new EffectQueue(queueConfig);

            queue.on("queue-state-updated", (_, newState) => {
                if (newState.queue) {
                    this.emit("length-updated", {
                        id: queue.id,
                        length: newState.queue.length
                    });
                }
            });

            this._queues[queueConfig.id] = queue;
        }
        return queue;
    }

    addEffectsToQueue(queueConfig: EffectQueueConfig, runEffectsContext: RunEffectsContext, duration?: number, priority: "none" | "high" = "none") {
        if (queueConfig == null || runEffectsContext == null) {
            return;
        }

        const queue = this._getQueue(queueConfig);

        queue.addEffects(runEffectsContext, duration, priority);
    }

    updateQueue(queueConfig: EffectQueueConfig) {
        if (queueConfig == null) {
            return;
        }

        const queue = this._queues[queueConfig.id];
        if (queue == null) {
            return;
        }

        queue.updateConfig(queueConfig);

        if (queueConfig.active) {
            queue.resumeQueue();
        } else {
            queue.pauseQueue();
        }
    }

    removeQueue(queueId: string, abortActiveEffectLists = false) {
        if (queueId == null) {
            return;
        }
        const queue = this._queues[queueId];

        if (queue == null) {
            return;
        }

        logger.debug(`Removing queue ${queue.id}`);

        queue.cancelQueue(abortActiveEffectLists);

        delete this._queues[queueId];
    }

    getQueueLength(queueId: string): number {

        const queue = this._queues[queueId];

        if (queue == null) {
            return 0;
        }

        return queue.queueLength;
    }

    clearAllQueues(abortActiveEffectLists = false) {
        const queueIds = Object.keys(this._queues);
        for (const queueId of queueIds) {
            this.removeQueue(queueId, abortActiveEffectLists);
        }
    }

    abortActiveEffectListsForQueue(queueId: string, bubbleStop = true) {
        const queue = this._queues[queueId];
        if (queue == null) {
            return;
        }
        queue.abortActiveEffectLists(bubbleStop);
    }

    abortActiveEffectListsForAllQueues(bubbleStop = true) {
        const queueIds = Object.keys(this._queues);
        for (const queueId of queueIds) {
            this.abortActiveEffectListsForQueue(queueId, bubbleStop);
        }
    }
}

const runner = new EffectQueueRunner();

export default runner;