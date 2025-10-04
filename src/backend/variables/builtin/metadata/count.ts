import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { CommandDefinition } from "../../../../types/commands";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import { EffectTrigger } from "../../../../shared/effect-constants";

const triggers = {};
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.PRESET_LIST] = true;
triggers[EffectTrigger.EVENT] = [
    "twitch:chat-message"
];
triggers[EffectTrigger.MANUAL] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "count",
        usage: "count",
        description: "Displays the number of times the given command has been run.",
        triggers: triggers,
        categories: [VariableCategory.COMMON],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (trigger: Trigger) => {
        return trigger.metadata.command?.count
            ?? (trigger.metadata.eventData?.command as CommandDefinition)?.count
            ?? 0;
    }
};

export default model;
