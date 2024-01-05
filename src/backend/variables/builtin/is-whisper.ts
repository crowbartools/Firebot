import { ReplaceVariable } from "../../../types/variables";
import { EffectTrigger } from "../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../shared/variable-constants";

const triggers = {};
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.MANUAL] = true;

const IsWhisperVariable: ReplaceVariable = {
    definition: {
        handle: "isWhisper",
        description: "Returns `true` if the chat message that triggered a command is a whisper, otherwise returns `false`.",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        const chatMessage = trigger.metadata?.eventData?.chatMessage ?? trigger.metadata?.chatMessage;
        return chatMessage?.whisper ?? false;
    }
};

export = IsWhisperVariable;