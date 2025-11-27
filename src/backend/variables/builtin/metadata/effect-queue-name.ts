import type { ReplaceVariable, TriggersObject } from "../../../../types/variables";
import { EffectQueueConfigManager } from "../../../effects/queues/effect-queue-config-manager";

const triggers: TriggersObject = {};
triggers["event"] = ["firebot:effect-queue-cleared", "firebot:effect-queue-added", "firebot:effect-queue-status"];
triggers["manual"] = true;

const model: ReplaceVariable = {
    definition: {
        handle: "effectQueueName",
        description: "The name of the effect queue.",
        triggers: triggers,
        categories: ["trigger based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger) => {
        const queueId = trigger?.metadata?.eventData?.effectQueueId as string;
        const effectQueue = EffectQueueConfigManager.getItem(queueId);
        return effectQueue?.name ?? "Unknown";
    }
};

export default model;