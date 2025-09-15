import { ReplaceVariable } from "../../../../types/variables";
import { EffectTrigger } from "../../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import effectQueueManager from "../../../effects/queues/effect-queue-config-manager";

const triggers = {};
triggers[EffectTrigger.EVENT] = ["firebot:effect-queue-cleared", "firebot:effect-queue-added", "firebot:effect-queue-status"];
triggers[EffectTrigger.MANUAL] = true;

const model: ReplaceVariable = {
    definition: {
        handle: "effectQueueStatus",
        description: "The status of the effect queue.",
        triggers: triggers,
        categories: [VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.BOOLEAN, OutputDataType.NULL]
    },
    evaluator: (trigger) => {
        const queueId = trigger?.metadata?.eventData?.effectQueueId;
        const effectQueue = effectQueueManager.getItem(queueId);

        return effectQueue?.active ?? null;
    }
};

export default model;