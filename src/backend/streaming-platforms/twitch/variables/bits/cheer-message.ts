import type { ReplaceVariable, Trigger, TriggersObject } from "../../../../../types/variables";

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
        const cheerMessage = <string>(trigger.metadata.eventData.cheerMessage || "");
        return cheerMessage
            .replace(/[a-zA-Z]+\d+( |\b)/g, "")
            .trim();
    }
};

export default model;
