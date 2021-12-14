// Migration: info needed

"use strict";

const {
    EffectTrigger
} = require("../../effects/models/effectModels");

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const expressionish = require('expressionish');

let triggers = {};
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.MANUAL] = true;

const model = {
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
        triggers: triggers,
        categories: [VariableCategory.COMMON],
        possibleDataOutput: [OutputDataType.NUMBER, OutputDataType.TEXT]
    },
    evaluator: (trigger, index, upperIndex) => {
        let args = trigger.metadata.userCommand.args || [];

        if (String(index).toLowerCase() === "all") {
            return args.join(" ");
        }

        if (index != null) {
            index = parseInt(index);
        }

        if (index != null && index > 0) {
            index--;
        } else {
            index = 0;
        }

        if (upperIndex == null) {
            return args[index] || "";
        }

        if (upperIndex === "last") {
            upperIndex = args.length;
        }

        if (upperIndex != null) {
            upperIndex = parseInt(upperIndex);
        }

        return args.slice(index, upperIndex).join(" ");
    },
    argsCheck: (index, upperIndex) => {
        // both args can be null
        if (index == null && upperIndex == null) {
            return true;
        }

        // index needs to either be "all" or a number
        if (String(index).toLowerCase() !== "all" && isNaN(index)) {
            throw new expressionish.ExpressionArgumentsError("First argument needs to be either 'all' or a number.", 0);
        }

        // upperIndex needs to either be null, "last", or a number
        if (upperIndex != null && String(upperIndex).toLowerCase() !== "last" && isNaN(upperIndex)) {
            throw new expressionish.ExpressionArgumentsError("Second argument needs to be either 'last' or a number.", 1);
        }

        return true;
    }
};

module.exports = model;
