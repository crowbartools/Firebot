import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

import effectQueueManager from "../../../effects/queues/effect-queue-manager";

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
            return selectedQueue.length.toString();
        }
        return "Unknown";
    }
};

export default model;