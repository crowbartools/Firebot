import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

import effectQueueManager from "../../../effects/queues/effect-queue-config-manager";
import effectQueueRunner from "../../../effects/queues/effect-queue-runner";

const model : ReplaceVariable = {
    definition: {
        handle: "effectQueueLength",
        usage: "effectQueueLength[queueName]",
        description: "Returns the length of an effect queue. Useful for showing queue length in a command response.",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (_trigger, text = "") => {
        const selectedQueue = effectQueueManager.getAllItems().find(queue => queue.name === text);
        if (selectedQueue) {
            const queueState = effectQueueRunner.getQueueStateForConfig(selectedQueue);
            return queueState?.queuedItems?.length.toString() || "0";
        }
        return "Unknown";
    }
};

export default model;