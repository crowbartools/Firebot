import type { ReplaceVariable, Trigger, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:bits-powerup-gigantified-emote"];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "gigantifiedEmoteName",
        description: "The name of the gigantified emote.",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger: Trigger) => trigger.metadata.eventData.emoteName
};

export default model;
