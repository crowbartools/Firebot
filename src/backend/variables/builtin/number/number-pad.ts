import type { ReplaceVariable, Trigger } from "../../../../types/variables";

const model : ReplaceVariable = {
    definition: {
        handle: "padNumber",
        description: "Pads the given number up to the specified number of decimal places.",
        usage: "padNumber[value, places]",
        categories: ["numbers"],
        possibleDataOutput: ["text"]
    },
    evaluator: (
        trigger: Trigger,
        value: string | number,
        places: string | number
    ) : string => {
        const numValue = Number(value);
        const numPlaces = Number(places);
        if (
            value == null || value === "" || !Number.isFinite(numValue) ||
            places == null || places === "" || !Number.isFinite(numPlaces)
        ) {
            return `${value}`;
        }

        const [integer, fraction] = `${numValue}.0`.split(/\./g);

        return `${integer}.${fraction.padEnd(numPlaces, "0")}`;
    }
};

export default model;