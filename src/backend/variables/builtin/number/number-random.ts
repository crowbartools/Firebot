import { randomInt } from 'node:crypto';

import type { ReplaceVariable, Trigger } from "../../../../types/variables";

const model : ReplaceVariable = {
    definition: {
        handle: "randomNumber",
        usage: "randomNumber[min, max]",
        description: "Get a random number between the given range.",
        categories: ["common", "numbers"],
        possibleDataOutput: ["number"]
    },
    evaluator: (
        trigger: Trigger,
        min: string | number,
        max: string | number
    ) : number => {
        min = Number(min);
        max = Number(max);
        if (!Number.isFinite(min) || !Number.isFinite(max)) {
            return 0;
        }
        if (min > max) {
            [min, max] = [max, min];
        }

        return randomInt(Math.floor(min), Math.floor(max) + 1);
    }
};

export default model;