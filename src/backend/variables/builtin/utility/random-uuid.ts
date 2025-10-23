import { randomUUID } from "crypto";
import type { ReplaceVariable } from "../../../../types/variables";

const model : ReplaceVariable = {
    definition: {
        handle: "randomUUID",
        usage: "randomUUID",
        description: "Returns a random formated UUID eg 00000000-0000-0000-0000-000000000000",
        categories: ["advanced"],
        possibleDataOutput: ["text"]
    },
    evaluator: () => {
        return randomUUID();
    }
};

export default model;
