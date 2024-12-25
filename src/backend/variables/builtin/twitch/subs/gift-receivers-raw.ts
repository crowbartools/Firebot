import { ReplaceVariable } from "../../../../../types/variables";
import { EffectTrigger } from "../../../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";

const triggers = {};
triggers[EffectTrigger.EVENT] = ["twitch:community-subs-gifted"];
triggers[EffectTrigger.MANUAL] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "rawGiftReceivers",
        description: "Returns a raw array containing the recipients' usernames and months subbed",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.USER, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.ARRAY, OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        if (trigger == null || trigger.metadata == null || trigger.metadata.eventData == null || trigger.metadata.eventData.giftReceivers == null) {
            return "Failed to get gift receiver info";
        }

        return trigger.metadata.eventData.giftReceivers.map(gr => ({
            username: gr.gifteeUsername,
            months: gr.giftSubMonths
        }));
    }
};

export default model;
