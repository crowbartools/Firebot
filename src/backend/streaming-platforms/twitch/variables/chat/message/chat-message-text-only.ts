import { EffectTrigger } from "../../../../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../../../../shared/variable-constants";
import { FirebotParsedMessagePart } from "../../../../../../types/chat";
import { ReplaceVariable } from "../../../../../../types/variables";

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
        handle: "chatMessageTextOnly",
        description: "Outputs the chat message text from the associated command or chat event, with any emotes, URLs, or cheermotes removed",
        usage: "chatMessageTextOnly[trimCommandTriggerDefaultTrue]",
        examples: [
            {
                usage: "chatMessageTextOnly",
                description: "Gets the message text with the command trigger removed, and with any emotes, URLs, or cheermotes removed."
            },
            {
                usage: "chatMessageTextOnly[true]",
                description: "Gets the message text with the command trigger removed, and with any emotes, URLs, or cheermotes removed."
            },
            {
                usage: "chatMessageTextOnly[false]",
                description: "Gets the message text (including command trigger) with any emotes, URLS, or cheermotes removed."
            }
        ],
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger, ...args: unknown[]) => {
        let messageParts: FirebotParsedMessagePart[] = [];
        if (trigger?.type === EffectTrigger.COMMAND && trigger.metadata?.chatMessage?.parts) {
            messageParts = trigger.metadata.chatMessage.parts;
        } else if (trigger?.type === EffectTrigger.EVENT && trigger.metadata?.eventData?.chatMessage?.parts) {
            messageParts = trigger.metadata.eventData.chatMessage.parts;
        }

        // Get all text parts trimmed into a flat array. None /should/ ever be null, but defensively filter, then filter out empties trim created.
        // e.g: "!trigger bleedPurple bleedPurple" maps to ["!trigger ", " "], trims to ["!trigger", ""], filters again to ["!trigger"]
        const textParts = messageParts
            .filter(mp => mp.type === "text" && mp.text !== null)
            .map(mp => mp.text.trim())
            .filter(tp => tp !== "");

        // Trim the command trigger if this was a command, unless an optional argument of false was provided.
        if (trigger?.type === EffectTrigger.COMMAND && trigger?.metadata?.userCommand?.trigger !== null &&
            (args.length < 1 || !(args[0] === false || `${args[0]}`.toLowerCase() === "false"))) {

            const triggerRegex = new RegExp(trigger.metadata.userCommand.trigger, "i");
            const triggerIndex = textParts.findIndex(tp => triggerRegex.test(tp));

            if (triggerIndex >= 0) {
                // A trigger /could/ greedy include white space, and be in the middle of a part, but most triggers likely won't.
                // So replace it with "text" that DOES have whitespace around it, and greedily replace /that/ with a single space.
                textParts[triggerIndex] = textParts[triggerIndex]
                    .replace(triggerRegex, " \x1A ")
                    // eslint-disable-next-line no-control-regex
                    .replace(/\s+\x1A\s+/, " ")
                    .trim();

                // Remove the entire text portion if it's now empty, such as with: "!trigger bleedPurple foo bar"
                if (textParts[triggerIndex] === "") {
                    textParts.splice(triggerIndex, 1);
                }
            }
        }

        // Return the array concatenated with spaces, or an empty string.
        return textParts.join(" ");
    }
};

export default model;
