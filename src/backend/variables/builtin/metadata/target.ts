import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { EffectTrigger } from "../../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const triggers = {};
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.CHANNEL_REWARD] = true;
triggers[EffectTrigger.MANUAL] = true;

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
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger: Trigger, index: number) => {
        let args = trigger.metadata.userCommand?.args ?? <string[]>trigger.metadata.args;
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