import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import roleManager from "../../../roles/chat-roles-manager";

const model : ReplaceVariable = {
    definition: {
        handle: "vipArray",
        usage: "vipArray",
        description: "Returns an array of all `VIPs`",
        categories: [VariableCategory.COMMON, VariableCategory.USER],
        possibleDataOutput: [OutputDataType.ARRAY]
    },
    evaluator: async () => {
        try {
            return await roleManager.getVips();
        } catch {
            // Silently fail
        }

        return [];
    }
};
export default model;