import { EffectQueueConfig } from "../../../types/effects";

import JsonDbManager from "../../database/json-db-manager";
import effectQueueRunner from "./effect-queue-runner";
import frontendCommunicator from "../../common/frontend-communicator";
import { simpleClone } from "../../utils";

class EffectQueueConfigManager extends JsonDbManager<EffectQueueConfig> {
    constructor() {
        super("Effect Queue", "/effects/effectqueues");

        frontendCommunicator.on("effect-queues:get-effect-queues",
            () => this.getAllItems()
        );

        frontendCommunicator.on("effect-queues:save-effect-queue",
            (effectQueue: EffectQueueConfig) => this.saveItem(effectQueue)
        );

        frontendCommunicator.on("effect-queues:save-all-effect-queues",
            (allEffectQueues: EffectQueueConfig[]) => this.saveAllItems(allEffectQueues)
        );

        frontendCommunicator.on("effect-queues:delete-effect-queue",
            (id: string) => this.deleteItem(id)
        );

        frontendCommunicator.on("effect-queues:clear-effect-queue",
            (id: string) => effectQueueRunner.removeQueue(id)
        );

        frontendCommunicator.on("effect-queues:toggle-effect-queue",
            (id: string) => this.toggleQueue(id)
        );
    }

    loadItems(): void {
        super.loadItems();
        const queues = this.getAllItems();

        let save = false;

        for (const queue of queues) {
            if (queue.active == null) {
                queue.active = true;
                save = true;
            }
        }
        if (save) {
            this.saveAllItems(queues);
        }
    }

    saveItem(effectQueueConfig: EffectQueueConfig): EffectQueueConfig {
        delete effectQueueConfig.length;
        delete effectQueueConfig.queue;
        const savedEffectQueueConfig = super.saveItem(effectQueueConfig);

        if (savedEffectQueueConfig) {
            effectQueueRunner.updateQueue(savedEffectQueueConfig);
            return savedEffectQueueConfig;
        }

        return null;
    }

    saveAllItems(allItems: EffectQueueConfig[]): void {
        for (const item of allItems) {
            delete item.length;
            delete item.queue;
        }
        super.saveAllItems(allItems);
    }

    getAllItems(): EffectQueueConfig[] {
        const items = simpleClone(super.getAllItems());
        for (const item of items) {
            item.length = effectQueueRunner.getQueueLength(item.id);
        }
        return items;
    }

    getItem(id: string): EffectQueueConfig {
        const item = simpleClone(super.getItem(id));

        if (item == null) {
            return null;
        }

        item.length = effectQueueRunner.getQueueLength(id);

        return item;
    }

    triggerUiRefresh(): void {
        frontendCommunicator.send("all-queues", this.getAllItems());
    }

    private setQueueActiveStatus(
        queue: EffectQueueConfig,
        status: boolean,
        runEffectsImmediatelyWhenPaused: boolean = undefined
    ): void {
        queue.active = status;
        if (runEffectsImmediatelyWhenPaused != null) {
            queue.runEffectsImmediatelyWhenPaused = runEffectsImmediatelyWhenPaused;
        }
        this.saveItem(queue);
        frontendCommunicator.send("updateQueueStatus", { id: queue.id, active: status });
    }

    pauseQueue(queueId: string, runEffectsImmediatelyWhenPaused: boolean = undefined): void {
        const queue = this.getItem(queueId);
        if (queue != null && queue.active) {
            this.setQueueActiveStatus(queue, false, runEffectsImmediatelyWhenPaused);
        } else if (runEffectsImmediatelyWhenPaused != null) {
            queue.runEffectsImmediatelyWhenPaused = runEffectsImmediatelyWhenPaused;
            this.saveItem(queue);
        }
    }

    resumeQueue(queueId: string): void {
        const queue = this.getItem(queueId);
        if (queue != null && !queue.active) {
            this.setQueueActiveStatus(queue, true);
        }
    }

    toggleQueue(queueId: string, runEffectsImmediatelyWhenPaused: boolean = undefined): void {
        const queue = this.getItem(queueId);
        if (queue != null) {
            const newStatus = !queue.active;
            this.setQueueActiveStatus(queue, newStatus, !newStatus ? runEffectsImmediatelyWhenPaused : undefined);
        }
    }
}

const manager = new EffectQueueConfigManager();

export { manager as EffectQueueConfigManager };