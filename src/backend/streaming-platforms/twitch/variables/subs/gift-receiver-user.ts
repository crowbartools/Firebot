import type { ReplaceVariable, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:subs-gifted", "twitch:gift-sub-upgraded"];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "giftReceiverUsername",
        description: "The name of the user who just received a gifted sub.",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger) => {
        const gifteeUsername = trigger.metadata.eventData.gifteeUsername;

        return gifteeUsername || "UnknownUser";
    }
};

export default model;
