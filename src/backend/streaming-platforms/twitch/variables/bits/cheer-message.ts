import type { ReplaceVariable, Trigger, TriggersObject } from "../../../../../types/variables";
import { EventSubChannelBitsUseMessagePart } from "../../api/twurple-private-types";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:cheer", "twitch:bits-powerup-message-effect", "twitch:bits-powerup-gigantified-emote"];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "cheerMessage",
        description: "The message included with the cheer",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger: Trigger) => {
        if (trigger.metadata.eventData.cheerMessageParts == null) {
            const cheerMessage = (trigger.metadata.eventData.cheerMessage || "") as string;
            return cheerMessage
                .replace(/[a-zA-Z]+\d+( |\b)/g, "")
                .trim();
        }

        const cheerMessageParts: string[] = [];

        for (const part of (trigger.metadata.eventData.cheerMessageParts as EventSubChannelBitsUseMessagePart[])) {
            if (part.type === "cheermote") {
                continue;
            }

            cheerMessageParts.push(part.text.trim());
        }

        return cheerMessageParts.join(" ");
    }
};

export default model;
