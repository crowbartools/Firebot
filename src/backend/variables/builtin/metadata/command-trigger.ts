import type { ReplaceVariable, TriggersObject } from "../../../../types/variables";
import type { UserCommand } from "../../../../types/commands";

const triggers: TriggersObject = {};
triggers["command"] = true;
triggers["event"] = [
    "twitch:chat-message"
];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "commandTrigger",
        description: "The trigger of the issued command.",
        triggers: triggers,
        categories: ["trigger based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger) => {
        return trigger.metadata.userCommand?.trigger
            ?? (trigger.metadata.eventData?.userCommand as UserCommand)?.trigger;
    }
};

export default model;
