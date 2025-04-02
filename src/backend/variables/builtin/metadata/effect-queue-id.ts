import { ReplaceVariable } from "../../../../types/variables";
import { EffectTrigger } from "../../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const triggers = {};
triggers[EffectTrigger.EVENT] = ["firebot:effect-queue-cleared", "firebot:effect-queue-added", "firebot:effect-queue-status"];
triggers[EffectTrigger.MANUAL] = true;

const model: ReplaceVariable = {
    definition: {
        handle: "effectQueueId",
        description: "The ID of the effect queue.",
        triggers: triggers,
        categories: [VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        const queueId = trigger?.metadata?.eventData?.effectQueueId;
        return queueId ?? "Unknown";
    }
};

export default model;