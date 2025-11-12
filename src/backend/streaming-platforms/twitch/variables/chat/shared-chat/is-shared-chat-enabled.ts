import type { ReplaceVariable } from "../../../../../../types/variables";
import sharedChatCache from "../../../shared-chat-cache";

const model : ReplaceVariable = {
    definition: {
        handle: "isSharedChatEnabled",
        description: "Returns true when in a shared chat session, false otherwise.",
        categories: ["common"],
        possibleDataOutput: ["bool"]
    },
    evaluator: () => {
        return sharedChatCache.isActive;
    }
};

export default model;