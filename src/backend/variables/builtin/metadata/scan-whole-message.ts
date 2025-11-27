import type { ReplaceVariable, TriggersObject } from "../../../../types/variables";
import type { CommandDefinition } from "../../../../types/commands";

const triggers: TriggersObject = {};
triggers["command"] = true;
triggers["event"] = [
    "twitch:chat-message"
];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "scanWholeMessage",
        description: "Returns `true` if the command has the **Scan Whole Message** option enabled, or `false` otherwise.",
        triggers: triggers,
        categories: ["trigger based"],
        possibleDataOutput: ["bool"]
    },
    evaluator: (trigger) => {
        return (trigger.metadata.command?.scanWholeMessage
            ?? (trigger.metadata.eventData?.command as CommandDefinition)?.scanWholeMessage)
            === true;
    }
};

export default model;
