import type { ReplaceVariable } from "../../../../../../types";
import { TwitchApi } from "../../../api";

const model : ReplaceVariable = {
    definition: {
        handle: "pinnedChatMessageTextOnly",
        description: "Outputs the pinned chat message text with any emotes, URLs, or cheermotes removed.",
        categories: ["common"],
        possibleDataOutput: ["text"]
    },
    evaluator: async () => {
        const pinnedMessage = await TwitchApi.chat.getPinnedChatMessage();

        const textParts = (pinnedMessage?.message?.fragments ?? [])
            .filter(mp => mp.type === "text" && mp.text !== null)
            .map(mp => mp.text.trim())
            .filter(tp => tp !== "");

        return textParts.join(" ");
    }
};

export default model;