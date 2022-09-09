// Migration: done

"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const counterManager = require("../../counters/counter-manager");

const model = {
    definition: {
        handle: "counter",
        usage: "counter[name]",
        description: "Displays the value of the given counter.",
        categories: [VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (_, name) => {
        const counter = counterManager.getCounterByName(name);
        return counter ? counter.value : -1;
    }
};

module.exports = model;
