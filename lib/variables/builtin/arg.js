"use strict";


const {
    EffectTrigger
} = require("../../effects/models/effectModels");


/**
 * The $subMonths variable
 */

let triggers = {};
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "arg",
        usage: "arg[num, num2]",
        description: "Grabs the argument at the given index. If you provide two indexes, all arguments ",
        triggers: triggers
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
            index = index - 1;
        } else {
            index = 0;
        }

        if (upperIndex == null) {
            return args[index] || "";
        }

        if (upperIndex === "last") {
            upperIndex = args.length - 1;
        }

        if (upperIndex != null) {
            upperIndex = parseInt(upperIndex);
        }

        if (upperIndex > args.length - 1) {
            return null;
        }
        upperIndex = upperIndex - 1;


        return args.slice(index, upperIndex).join(" ");
    },
    argsCheck: (index, upperIndex) => {
        // both args can be null
        if (index == null && upperIndex == null) return true;

        // index needs to either be "all" or a number
        if (String(index).toLowerCase() !== "all" && isNaN(index)) {
            throw new SyntaxError("Index needs to be either 'all' or a number.");
        }

        // upperIndex needs to either be null, "last", or a number
        if (upperIndex != null && String(upperIndex).toLowerCase() !== "last" && isNaN(upperIndex)) {
            throw new SyntaxError("upperIndex needs to be either 'last' or a number.");
        }

        return true;
    }
};

module.exports = model;
