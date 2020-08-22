// Migration: done

"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");

const counterManager = require("../../counters/counter-manager");

const model = {
    definition: {
        handle: "counter",
        usage: "counter[name]",
        description: "Displays the value of the given counter.",
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (_, name) => {
        const counter = counterManager.getCounterByName(name);
        return counter ? counter.value : -1;
    }
};

module.exports = model;
