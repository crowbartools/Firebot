import { TypedEmitter } from "tiny-typed-emitter";
import logger from "../../logwrapper";
import effectRunner from "../../common/effect-runner";
import { timeout } from "../../utils";
import eventManager from "../../events/EventManager";
import { abortEffectList } from "../../common/effect-abort-helpers";
import { EffectQueueConfig } from "./effect-queue-config-manager";
import { EffectList } from "../../../types/effects";

export type QueueStatus = "running" | "paused" | "idle" | "canceled";

export type RunEffectsContext = {
    effects?: EffectList
    [key: string]: unknown;
}

type QueueItem = {
    runEffectsContext: RunEffectsContext
    duration?: number;
    priority?: "none" | "high";
}

export type QueueState = {
    status: QueueStatus;
    queuedItems: QueueItem[];
    activeItems: QueueItem[];
    interval: number;
    mode: string;
}

type Events = {
    "queue-state-updated": (newState: QueueState, changedState: Partial<QueueState>) => void;
};

export class EffectQueue extends TypedEmitter<Events> {

    public id: string;

    private _state: QueueState;

    constructor(config: EffectQueueConfig) {
        super();

        this.id = config.id;

        this._setState({
            status: config.active !== false ? "idle" : "paused",
            interval: config.interval,
            mode: config.mode,
            queuedItems: [],
            activeItems: []
        });
    }

    private _setState(stateUpdate: Partial<QueueState>) {
        const newState = {
            ...this._state,
            ...stateUpdate
        };

        this._state = newState;

        this.emit("queue-state-updated", newState, stateUpdate);
    }

    get state(): QueueState {
        return JSON.parse(JSON.stringify(this._state));
    }

    get queueLength() {
        return this._state.queuedItems.length;
    }

    private async _runEffects(queueItem: QueueItem) {

        if (!queueItem.runEffectsContext.effects.id) {
            logger.warn(`No effect list id provided for queue ${this.id}.`,
                queueItem.runEffectsContext
            );
            return;
        }

        this._setState({
            activeItems: [...this._state.activeItems, queueItem]
        });

        await effectRunner.runEffects(queueItem.runEffectsContext)
            .catch((err) => {
                logger.warn(`Error while processing effects for queue ${this.id}`, err);
            });

        const filteredActiveItems = this._state.activeItems.filter(item => item.runEffectsContext.effects.id !== queueItem.runEffectsContext.effects.id);
        this._setState({
            activeItems: filteredActiveItems
        });
    }

    private async _runQueue(): Promise<void> {
        if (this._state.queuedItems.length === 0 || this._state.status === "canceled" || this._state.status === "paused") {
            return;
        }
        const [nextQueueEntry, ...restOfQueue] = this._state.queuedItems;

        this._setState({
            queuedItems: restOfQueue
        });

        if (nextQueueEntry.runEffectsContext == null) {
            return;
        }

        logger.debug(`Running next effects for queue ${this.id}. Mode=${this._state.mode}, Interval?=${this._state.interval}, Remaining queue length=${this._state.queuedItems.length}`);


        if (this._state.mode === "interval") {
            this._runEffects(nextQueueEntry);

            await timeout(this._state.interval * 1000);

            return this._runQueue();
        }

        if (this._state.mode === "auto") {
            await this._runEffects(nextQueueEntry);

            await timeout((this._state.interval ?? 0) * 1000);

            return this._runQueue();
        }

        if (this._state.mode === "custom") {
            this._runEffects(nextQueueEntry);

            await timeout((nextQueueEntry.duration ?? 0) * 1000);

            return this._runQueue();
        }
    }

    addEffects(runEffectsContext: RunEffectsContext, duration?: number, priority: "none" | "high" = "none") {
        const queueEntry: QueueItem = {
            runEffectsContext,
            duration,
            priority
        };

        const queue = [...this._state.queuedItems];

        if (priority === "high") {
            const firstNonPriority = queue.findIndex(entry => entry.priority !== "high");
            if (firstNonPriority > -1) {
                queue.splice(firstNonPriority, 0, queueEntry);
            } else {
                queue.push(queueEntry);
            }
        } else {
            queue.push(queueEntry);
        }

        this._setState({
            queuedItems: queue
        });


        logger.debug(`Added more effects to queue ${this.id}. Current length=${queue.length}`);

        eventManager.triggerEvent("firebot", "effect-queue-added", {
            effectQueueId: this.id
        });

        this.processEffectQueue();
    }

    processEffectQueue() {
        if (this._state.status === "canceled") {
            return;
        }
        if (this._state.status === "paused") {
            logger.debug(`Queue ${this.id} is paused. Will run effects once queue is resumed.`);
            return;
        }

        if (this._state.status === "idle" && this._state.queuedItems.length > 0) {
            logger.debug(`Queue ${this.id} is idle... spinning up.`);
            this._setState({
                status: "running"
            });
            this._runQueue().then(() => {
                logger.debug(`Queue ${this.id} is ${this._state.status === "paused" && this._state.queuedItems.length > 0 ? "paused" : "cleared"}... going idle.`);
                if (this._state.status === "running") {
                    this._setState({
                        status: "idle"
                    });
                }
                if (this._state.queuedItems.length === 0) {
                    eventManager.triggerEvent("firebot", "effect-queue-cleared", {
                        effectQueueId: this.id
                    });
                }
            });
        }
    }

    abortActiveEffectLists(bubbleStop = true) {
        if (this._state.activeItems.length === 0) {
            return;
        }

        logger.debug(`Aborting active effect lists for queue ${this.id}...`);

        for (const queueItem of this._state.activeItems) {
            abortEffectList(queueItem.runEffectsContext.effects.id, bubbleStop);
        }

        this._setState({
            activeItems: []
        });
    }

    cancelQueue(abortActiveEffectLists: boolean) {
        logger.debug(`Cancelling queue ${this.id}...`);

        this._setState({
            status: "canceled",
            queuedItems: []
        });

        if (abortActiveEffectLists) {
            this.abortActiveEffectLists();
        }
    }

    pauseQueue() {
        logger.debug(`Pausing queue ${this.id}...`);

        eventManager.triggerEvent("firebot", "effect-queue-status", {
            effectQueueId: this.id
        });

        this._setState({
            status: "paused"
        });
    }

    resumeQueue() {
        logger.debug(`Resuming queue ${this.id}...`);

        eventManager.triggerEvent("firebot", "effect-queue-status", {
            effectQueueId: this.id
        });

        this._setState({
            status: "idle"
        });

        this.processEffectQueue();
    }

    updateConfig(config: EffectQueueConfig) {
        this._setState({
            mode: config.mode,
            interval: config.interval
        });

        logger.debug(`Updated queue ${this.id} config. Mode=${config.mode}, Interval=${config.interval}`);
    }

    toJSON() {
        return {
            id: this.id,
            state: this._state
        };
    }
}