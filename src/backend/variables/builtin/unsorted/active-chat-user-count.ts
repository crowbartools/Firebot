import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const logger = require("../../../logwrapper");
const activeViewerHandler = require("../../../chat/chat-listeners/active-user-handler");

const model : ReplaceVariable = {
    definition: {
        handle: "activeChatUserCount",
        description: "Get the number of active viewers in chat.",
        categories: [VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async () => {
        logger.debug("Getting number of active viewers in chat.");

        return activeViewerHandler.getActiveUserCount() || 0;
    }
};

export default model;
