import type { ReplaceVariable } from "../../../../../../types/variables";
import { SharedChatCache } from "../../../chat/shared-chat-cache";

const model : ReplaceVariable = {
    definition: {
        handle: "isSharedChatEnabled",
        description: "Returns true when in a shared chat session, false otherwise.",
        categories: ["common"],
        possibleDataOutput: ["bool"]
    },
    evaluator: () => {
        return SharedChatCache.isActive;
    }
};

export default model;