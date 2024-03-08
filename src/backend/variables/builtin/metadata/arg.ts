import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import { EffectTrigger } from "../../../../shared/effect-constants";

const expressionish = require('expressionish');

const model : ReplaceVariable = {
    definition: {
        handle: "arg",
        usage: "arg[#]",
        description: "Grabs the command argument (aka a word after the command !trigger) at the given index.",
        examples: [
            {
                usage: "arg[1,2]",
                description: "Grab a range of args."
            },
            {
                usage: "arg[2,last]",
                description: "Grab a range of args up to the last arg."
            },
            {
                usage: "arg[all]",
                description: "Grab all args. This is a good way to grab all text after the !command trigger."
            }
        ],
        triggers: {
            [EffectTrigger.COMMAND]: true,
            [EffectTrigger.CHANNEL_REWARD]: true,
            [EffectTrigger.MANUAL]: true
        },
        categories: [VariableCategory.COMMON],
        possibleDataOutput: [OutputDataType.NUMBER, OutputDataType.TEXT]
    },
    evaluator: (
        trigger: Trigger,
        index: number,
        upperIndex: number
    ) => {
        let args = trigger.metadata.userCommand?.args ?? <string[]>trigger.metadata.args;
        if (args == null || <unknown>args === '') {
            args = [];
        }

        if (String(index).toLowerCase() === "all") {
            return args.join(" ");
        }

        if (index != null) {
            index = parseInt(<string><unknown>index);
        }

        if (index != null && index > 0) {
            index--;
        } else {
            index = 0;
        }

        if (upperIndex == null) {
            return args[index] || "";
        }

        if (<string><unknown>upperIndex === "last") {
            upperIndex = args.length;
        }

        if (upperIndex != null) {
            upperIndex = parseInt(<string><unknown>upperIndex);
        }

        return args.slice(index, upperIndex).join(" ");
    },
    argsCheck: (index: unknown, upperIndex: unknown) => {
        // both args can be null
        if (index == null && upperIndex == null) {
            return true;
        }

        // index needs to either be "all" or a number
        if (String(index).toLowerCase() !== "all" && isNaN(<number>index)) {
            throw new expressionish.ExpressionArgumentsError("First argument needs to be either 'all' or a number.", 0);
        }

        // upperIndex needs to either be null, "last", or a number
        if (upperIndex != null && String(upperIndex).toLowerCase() !== "last" && isNaN(<number>upperIndex)) {
            throw new expressionish.ExpressionArgumentsError("Second argument needs to be either 'last' or a number.", 1);
        }

        return true;
    }
};

export default model;