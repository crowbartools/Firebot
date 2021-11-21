// Migration: info - Need implementation details

"use strict";

const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

let triggers = {};
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.MANUAL] = true;

/**
 * The $target variable
 */
const commmandTarget = {
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
        categories: [VariableCategory.COMMON],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger, index) => {
        let args = trigger.metadata.userCommand.args || [];

        index = parseInt(index);

        if (args.length < index) {
            return null;
        }

        if (index != null && index > 0) {
            index--;
        } else {
            index = 0;
        }

        return args[index].replace("@", "");
    },
    argsCheck: (index) => {
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

module.exports = commmandTarget;
