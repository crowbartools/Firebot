import { ReplaceVariable } from "../../../../../../types/variables";
import { EffectTrigger } from "../../../../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../../../../shared/variable-constants";

const triggers = {};
triggers[EffectTrigger.MANUAL] = true;
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.EVENT] = [
    "twitch:chat-message",
    "twitch:chat-message-deleted",
    "twitch:first-time-chat",
    "twitch:announcement",
    "twitch:viewer-arrived"
];

const model : ReplaceVariable = {
    definition: {
        handle: "chatMessageId",
        description: "Outputs the chat message ID from the associated command or event.",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.NUMBER, OutputDataType.TEXT]
    },
    evaluator: (trigger) => {

        let chatMessageId = "";
        if (trigger.metadata.chatMessage) {
            chatMessageId = trigger.metadata.chatMessage.id;

        } else if (trigger.type === EffectTrigger.EVENT || trigger.type === EffectTrigger.MANUAL) {
            chatMessageId = trigger.metadata.eventData.messageId;
        }

        return chatMessageId.trim();
    }
};

export default model;