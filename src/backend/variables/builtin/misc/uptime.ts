import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType } from "../../../../shared/variable-constants";
import util from "../../../utility";

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