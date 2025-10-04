import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import { EffectTrigger } from "../../../../shared/effect-constants";
import { UserCommand } from "../../../../types/commands";

const triggers = {};
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.EVENT] = [
    "twitch:chat-message"
];
triggers[EffectTrigger.MANUAL] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "argCount",
        description: "Returns the number of command args.",
        triggers: triggers,
        categories: [VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (trigger: Trigger) : number => {
        return trigger.metadata.userCommand?.args?.length
            ?? (trigger.metadata.eventData?.userCommand as UserCommand)?.args?.length
            ?? 0;
    }
};

export default model;
