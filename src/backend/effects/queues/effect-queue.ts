import { TypedEmitter } from "tiny-typed-emitter";
import logger from "../../logwrapper";
import frontendCommunicator from "../../common/frontend-communicator";
import effectRunner from "../../common/effect-runner";
import { timeout } from "../../utils";
import eventManager from "../../events/EventManager";
import { abortEffectList } from "../../common/effect-abort-helpers";

type Events = {
    "length-updated": (queueData: { id: string, length: number }) => void;
};

export type RunEffectsContext = {
    effects?: {
        id: string;
        list: unknown[];
    };
    [key: string]: unknown;
}

type QueueEntry = {
    runEffectsContext: RunEffectsContext
    duration?: number;
    priority?: "none" | "high";
}
export class EffectQueue extends TypedEmitter<Events> {

    private _paused = false;
    private _running = false;
    private _canceled = false;

    private _activeEffectListIds: string[] = [];
    private _queue: QueueEntry[] = [];

    constructor(public id: string, public mode: string, public interval = 0, active = true) {
        super();

        this._paused = !active;
    }

    get status() {
        if (this._canceled) {
            return "canceled";
        }

        if (this._paused) {
            return this._queue.length > 0 ? "paused" : "idle";
        }

        if (this._running) {
            return "running";
        }

        return "unknown";
    }

    get queueLength() {
        return this._queue.length;
    }

    private _sendQueueLengthUpdate(lengthOverride = null) {
        const queue = {
            id: this.id,
            length: lengthOverride ?? this._queue.length
        };

        frontendCommunicator.send("updateQueueLength", queue);

        this.emit("length-updated", queue);
    }

    private async _runEffects(context: RunEffectsContext) {
        if (context.effects?.id) {
            this._activeEffectListIds.push(context.effects.id);
        }

        await effectRunner.runEffects(context)
            .catch((err) => {
                logger.warn(`Error while processing effects for queue ${this.id}`, err);
            });

        if (context.effects?.id) {
            const index = this._activeEffectListIds.indexOf(context.effects.id);
            if (index > -1) {
                this._activeEffectListIds.splice(index, 1);
            }
        }
    }

    private async _runQueue(): Promise<void> {
        if (this._queue.length === 0 || this._canceled || this._paused === true) {
            return;
        }
        const { runEffectsContext, duration } = this._queue.shift();

        if (runEffectsContext == null) {
            return;
        }

        logger.debug(`Running next effects for queue ${this.id}. Mode=${this.mode}, Interval?=${this.interval}, Remaining queue length=${this._queue.length}`);

        this._sendQueueLengthUpdate();

        if (this.mode === "interval") {
            this._runEffects(runEffectsContext);

            await timeout(this.interval * 1000);

            return this._runQueue();
        }

        if (this.mode === "auto") {
            await this._runEffects(runEffectsContext);

            await timeout((this.interval ?? 0) * 1000);

            return this._runQueue();
        }

        if (this.mode === "custom") {
            this._runEffects(runEffectsContext);

            await timeout((duration || 0) * 1000);

            return this._runQueue();
        }
    }

    addEffects(runEffectsContext: RunEffectsContext, duration?: number, priority: "none" | "high" = "none") {
        const queueEntry: QueueEntry = {
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

        this._sendQueueLengthUpdate();

        this.processEffectQueue();
    }

    processEffectQueue() {
        if (this._paused) {
            logger.debug(`Queue ${this.id} is paused. Will run effects once queue is resumed.`);
        } else {
            if (!this._running && this._queue.length > 0) {
                logger.debug(`Queue ${this.id} is idle... spinning up.`);
                this._running = true;
                this._runQueue().then(() => {
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

    abortActiveEffectLists(bubbleStop = true) {
        if (this._activeEffectListIds.length === 0) {
            return;
        }

        logger.debug(`Aborting active effect lists for queue ${this.id}...`);
        for (const id of this._activeEffectListIds) {
            abortEffectList(id, bubbleStop);
        }
        this._activeEffectListIds = [];
    }

    cancelQueue(abortActiveEffectLists: boolean) {
        logger.debug(`Cancelling queue ${this.id}...`);

        this._sendQueueLengthUpdate(0);

        this._canceled = true;

        this._queue = [];

        if (abortActiveEffectLists) {
            this.abortActiveEffectLists();
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