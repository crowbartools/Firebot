import { TypedEmitter } from "tiny-typed-emitter";

import type {
    EffectQueueConfig,
    QueueState,
    RunEffectsContext
} from "../../../types/effects";

import { EffectQueue } from "./effect-queue";
import { EffectManager } from "../effect-manager";
import logger from "../../logwrapper";
import { simpleClone } from "../../utils";

type Events = {
    "length-updated": (queueData: { id: string, length: number }) => void;
    "queue-state-updated": (queueId: string, newState: QueueState, changedState: Partial<QueueState>) => void;
};

class EffectQueueRunner extends TypedEmitter<Events> {
    private _queues: Record<string, EffectQueue> = {};

    constructor() {
        super();
    }

    get queues(): Record<string, EffectQueue> {
        return simpleClone(this._queues);
    }

    getQueueStateForConfig(config: EffectQueueConfig): QueueState {
        const queue = this._queues[config.id];
        if (queue == null) {
            return {
                status: config.active === false ? "paused" : "idle",
                interval: config.interval,
                mode: config.mode,
                runEffectsImmediatelyWhenPaused: config.runEffectsImmediatelyWhenPaused,
                queuedItems: [],
                activeItems: []
            };
        }
        return queue.state;
    }

    private _getQueue(queueConfig: EffectQueueConfig) {
        let queue = this._queues[queueConfig.id];
        if (queue == null) {
            logger.debug(`Creating queue ${queueConfig.id}...`);

            queue = new EffectQueue(queueConfig);

            queue.on("queue-state-updated", (newState, changedState) => {

                this.emit("queue-state-updated", queue.id, newState, changedState);

                if (changedState.queuedItems) {
                    this.emit("length-updated", {
                        id: queue.id,
                        length: changedState.queuedItems.length
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

        for (const effect of runEffectsContext.effects.list) {
            const effectType = EffectManager.getEffectById(effect.type);
            if (effectType) {
                effect["__definition"] = effectType.definition;
            }
        }

        queue.addEffects(runEffectsContext, duration, priority);
    }

    triggerQueue(queueId: string) {
        if (queueId == null) {
            return;
        }

        const queue = this._queues[queueId];
        if (queue == null) {
            return;
        }

        queue.processEffectQueue();
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