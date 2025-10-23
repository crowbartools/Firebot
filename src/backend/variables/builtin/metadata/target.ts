import type { ReplaceVariable, Trigger, TriggersObject } from "../../../../types/variables";
import type { UserCommand } from "../../../../types/commands";

const triggers: TriggersObject = {};
triggers["command"] = true;
triggers["channel_reward"] = true;
triggers["event"] = [
    "twitch:chat-message"
];
triggers["manual"] = true;

/**
 * The $target variable
 */
const model : ReplaceVariable = {
    definition: {
        handle: "target",
        description: "Similar to the $arg variable but strips out any leading '@' symbols. Useful when the argument is expected to be a username.",
        usage: "target",
        examples: [
            {
                usage: "target[#]",
                description: "Grab the target at the given index (IE with '!command @ebiggz @TheLastMage', $target[2] would be 'TheLastMage')"
            }
        ],
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger: Trigger, index: number) => {
        let args = trigger.metadata.userCommand?.args
            ?? (trigger.metadata.eventData?.userCommand as UserCommand)?.args
            ?? <string[]>trigger.metadata.args;
        if (args == null || <unknown>args === '') {
            args = [];
        }

        index = parseInt(`${index}`);

        if (index != null && index > 0) {
            index--;
        } else {
            index = 0;
        }

        if (args.length < index || args[index] == null) {
            return null;
        }

        return args[index].replace("@", "");
    },
    argsCheck: (index?: number) => {
        // index can be null
        if (index == null) {
            return true;
        }

        // index needs to be a number
        if (isNaN(index)) {
            throw new SyntaxError("Index needs to be a number.");
        }

        return true;
    }
};

export default model;