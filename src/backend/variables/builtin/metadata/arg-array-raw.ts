import type { ReplaceVariable, Trigger, TriggersObject } from "../../../../types/variables";
import type { UserCommand } from "../../../../types/commands";

const triggers: TriggersObject = {};
triggers["command"] = true;
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "rawArgArray",
        description: "(Deprecated: use $argArray) Returns the raw array of command arguments",
        triggers: triggers,
        categories: ["trigger based", "advanced"],
        possibleDataOutput: ["array"],
        hidden: true
    },
    evaluator: (trigger: Trigger) : string[] => {
        return trigger.metadata.userCommand?.args
            ?? (trigger.metadata.eventData?.userCommand as UserCommand)?.args
            ?? [];
    }
};

export default model;