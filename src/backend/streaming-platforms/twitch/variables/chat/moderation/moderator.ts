import type { ReplaceVariable, TriggersObject } from "../../../../../../types/variables";


const triggers: TriggersObject = {};
triggers["event"] = ["twitch:banned", "twitch:unbanned", "twitch:timeout", "twitch:chat-mode-changed", "twitch:shoutout-sent", "twitch:outgoing-raid-canceled", "twitch:outgoing-raid-started"];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "moderator",
        description: "The name of the moderator that performed the action (ban, unban, timeout, chat mode change, shoutout, or raid create/cancel).",
        triggers: triggers,
        categories: ["user based", "trigger based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.moderator;
    }
};

export default model;
