// Deprecated
import type { ReplaceVariable, TriggersObject } from "../../../../types/variables";
import user from "../metadata/user";

const triggers: TriggersObject = {};
triggers["command"] = true;
triggers["event"] = true;
triggers["manual"] = true;
triggers["custom_script"] = true;
triggers["preset"] = true;
triggers["channel_reward"] = true;
triggers["quick_action"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "useridname",
        description: "(Deprecated: Use $user or $username) The associated underlying user identifying name for the given trigger.",
        triggers: triggers,
        possibleDataOutput: ["text"],
        hidden: true
    },
    evaluator: user.evaluator
};

export default model;