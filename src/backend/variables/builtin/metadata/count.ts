import type { ReplaceVariable, Trigger, TriggersObject } from "../../../../types/variables";
import type { CommandDefinition } from "../../../../types/commands";

const triggers: TriggersObject = {};
triggers["command"] = true;
triggers["preset"] = true;
triggers["event"] = [
    "twitch:chat-message"
];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "count",
        usage: "count",
        description: "Displays the number of times the given command has been run.",
        triggers: triggers,
        categories: ["trigger based", "common"],
        possibleDataOutput: ["number"]
    },
    evaluator: (trigger: Trigger) => {
        return trigger.metadata.command?.count
            ?? (trigger.metadata.eventData?.command as CommandDefinition)?.count
            ?? 0;
    }
};

export default model;
