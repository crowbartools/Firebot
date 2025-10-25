import { TypedEmitter } from "tiny-typed-emitter";

import type {
    EffectQueueConfig,
    QueueItem,
    QueueState,
    RunEffectsContext
} from "../../../types/effects";

import { EventManager } from "../../events/event-manager";
import effectRunner from "../../common/effect-runner";
import logger from "../../logwrapper";
import { abortEffectList } from "../../common/effect-abort-helpers";
import { simpleClone, wait } from "../../utils";

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
            activeItems: [],
            runEffectsImmediatelyWhenPaused: config.runEffectsImmediatelyWhenPaused ?? false
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
        return simpleClone(this._state);
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

        if (this._state.mode === "manual") {
            await this._runEffects(nextQueueEntry);
            return;
        }

        if (this._state.mode === "interval") {
            void this._runEffects(nextQueueEntry);

            await wait(this._state.interval * 1000);

            return this._runQueue();
        }

        if (this._state.mode === "auto") {
            await this._runEffects(nextQueueEntry);

            await wait((this._state.interval ?? 0) * 1000);

            return this._runQueue();
        }

        if (this._state.mode === "custom") {
            void this._runEffects(nextQueueEntry);

            await wait((nextQueueEntry.duration ?? 0) * 1000);

            return this._runQueue();
        }
    }

    addEffects(runEffectsContext: RunEffectsContext, duration?: number, priority: "none" | "high" = "none") {
        const queueEntry: QueueItem = {
            runEffectsContext,
            duration,
            priority
        };

        if (this._state.status === "paused" && this._state.runEffectsImmediatelyWhenPaused) {
            logger.debug(`Queue ${this.id} is paused but configured to run effects immediately. Running effects now...`);
            void this._runEffects(queueEntry);
            return;
        }

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

        void EventManager.triggerEvent("firebot", "effect-queue-added", {
            effectQueueId: this.id
        });

        if (this._state.mode !== "manual") {
            this.processEffectQueue();
        }
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
            void this._runQueue().then(() => {
                logger.debug(`Queue ${this.id} is ${this._state.status === "paused" && this._state.queuedItems.length > 0 ? "paused" : "cleared"}... going idle.`);
                if (this._state.status === "running") {
                    this._setState({
                        status: "idle"
                    });
                }
                if (this._state.queuedItems.length === 0) {
                    void EventManager.triggerEvent("firebot", "effect-queue-cleared", {
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

        void EventManager.triggerEvent("firebot", "effect-queue-status", {
            effectQueueId: this.id
        });

        this._setState({
            status: "paused"
        });

        if (this._state.runEffectsImmediatelyWhenPaused) {
            logger.debug(`Queue ${this.id} is paused but configured to run effects immediately. Running queued effects now...`);
            for (const queueItem of this._state.queuedItems) {
                void this._runEffects(queueItem);
            }
            this._setState({
                queuedItems: []
            });
        }
    }

    resumeQueue() {
        logger.debug(`Resuming queue ${this.id}...`);

        void EventManager.triggerEvent("firebot", "effect-queue-status", {
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
            interval: config.interval,
            runEffectsImmediatelyWhenPaused: config.runEffectsImmediatelyWhenPaused
        });

        logger.debug(`Updated queue ${this.id} config. Mode=${config.mode}, Interval=${config.interval}, RunEffectsImmediatelyWhenPaused=${config.runEffectsImmediatelyWhenPaused ?? false}`);
    }

    toJSON() {
        return {
            id: this.id,
            state: this._state
        };
    }
}