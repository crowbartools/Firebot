import { ReplaceVariable } from "../../../../types/variables";
import { EffectTrigger } from "../../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import effectQueueManager from "../../../effects/queues/effect-queue-manager";

const triggers = {};
triggers[EffectTrigger.EVENT] = ["firebot:effect-queue-cleared", "firebot:effect-queue-added", "firebot:effect-queue-status"];
triggers[EffectTrigger.MANUAL] = true;

const model: ReplaceVariable = {
    definition: {
        handle: "effectQueueName",
        description: "The name of the effect queue.",
        triggers: triggers,
        categories: [VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        const queueId = trigger?.metadata?.eventData?.effectQueueId;
        const effectQueue = effectQueueManager.getItem(queueId);
        return effectQueue?.name ?? "Unknown";
    }
};

export default model;