import { ReplaceVariable } from "../../../../types/variables";
import { randomUUID } from "crypto";

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
