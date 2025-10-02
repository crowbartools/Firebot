import { ReplaceVariable } from "../../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";

const model: ReplaceVariable = {
    definition: {
        handle: "isAnonymous",
        description: "Whether or not the gift sub(s) were given anonymously.",
        categories: [VariableCategory.TRIGGER, VariableCategory.USER],
        possibleDataOutput: [OutputDataType.BOOLEAN],
        triggers: {
            event: [
                "twitch:community-subs-gifted",
                "twitch:subs-gifted"
            ],
            manual: true
        }
    },
    evaluator: async (trigger) => {
        return trigger.metadata?.eventData?.isAnonymous === true;
    }
};

export default model;
