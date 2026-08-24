import type { ReplaceVariable, TriggersObject } from "../../../../types/variables";

const triggers: TriggersObject = {};
triggers["control_deck"] = true;
triggers["manual"] = true;

const model: ReplaceVariable = {
    definition: {
        handle: "controlDeckInput",
        usage: "controlDeckInput[name]",
        description: "The value of the given input supplied when the Control Deck control was pressed.",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["number", "text", "bool"]
    },

    evaluator: (trigger, inputName: string = "") => {
        const inputValues = (trigger.metadata.inputValues || {}) as Record<string, unknown>;
        return inputValues[inputName] ?? null;
    }
};

export default model;
