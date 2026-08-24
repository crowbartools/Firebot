import type { ReplaceVariable } from "../../../../../../types";
import { TwitchApi } from "../../../api";

const model : ReplaceVariable = {
    definition: {
        handle: "pinnedByUsername",
        description: "The username of the user who pinned the currenly pinned chat message text.",
        categories: ["common"],
        possibleDataOutput: ["text"]
    },
    evaluator: async () => {
        const pinnedMessage = await TwitchApi.chat.getPinnedChatMessage();
        return pinnedMessage?.pinnedByUserLogin ?? "";
    }
};

export default model;