import { ReplaceVariable } from "../../../../types/variables";
import { CommandDefinition } from "../../../../types/commands";
import { EffectTrigger } from "../../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const triggers = {};
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.EVENT] = [
    "twitch:chat-message"
];
triggers[EffectTrigger.MANUAL] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "scanWholeMessage",
        description: "Returns `true` if the command has the **Scan Whole Message** option enabled, or `false` otherwise.",
        triggers: triggers,
        categories: [VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.BOOLEAN]
    },
    evaluator: (trigger) => {
        return (trigger.metadata.command?.scanWholeMessage
            ?? (trigger.metadata.eventData?.command as CommandDefinition)?.scanWholeMessage)
            === true;
    }
};

export default model;
