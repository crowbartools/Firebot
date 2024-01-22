import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType } from "../../../../shared/variable-constants";

const util = require("../../../utility");

const model : ReplaceVariable = {
    definition: {
        handle: "uptime",
        description: "The current stream uptime",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async () => {
        return await util.getUptime();
    }
};

export default model;