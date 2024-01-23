import { ReplaceVariable } from "../../../../../types/variables";
import { EffectTrigger } from "../../../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";
import { FirebotParsedMessagePart } from "../../../../../types/chat";

const triggers = {};
triggers[EffectTrigger.MANUAL] = true;
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.EVENT] = [
    "twitch:chat-message",
    "twitch:first-time-chat",
    "firebot:highlight-message",
    "twitch:viewer-arrived"
];

const model: ReplaceVariable = {
    definition: {
        handle: "cheermoteAnimatedUrls",
        examples: [
            {
                usage: "cheermoteAnimatedUrls[1]",
                description: "Get the animated URL of a specific instance of a cheermote."
            }
        ],
        description: "Outputs the animated URLs of a chat message's cheermotes from the associated command or event.",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger, target: number = null) => {
        let messageParts: FirebotParsedMessagePart[] = [];
        if (trigger.type === EffectTrigger.COMMAND) {
            messageParts = trigger.metadata.chatMessage.parts;
        } else if (trigger.type === EffectTrigger.EVENT) {
            messageParts = trigger.metadata.eventData.chatMessage.parts;
        }

        const cheermoteAnimatedUrls = messageParts.filter(p => p.type === "cheer").map(e => e.animatedUrl);

        if (target != null) {
            return cheermoteAnimatedUrls[target];
        }

        return cheermoteAnimatedUrls;
    }
};

export default model;
