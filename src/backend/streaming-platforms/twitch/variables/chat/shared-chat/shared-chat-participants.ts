import { AccountAccess } from "../../../../../common/account-access";
import type { ReplaceVariable, Trigger } from "../../../../../../types/variables";
import { SharedChatCache } from "../../../chat/shared-chat-cache";

const model : ReplaceVariable = {
    definition: {
        handle: "sharedChatParticipants",
        description: "Return an array of shared chat participant objects, including the streamer account. Empty if not in a shared chat session.",
        examples: [
            {
                usage: "sharedChatParticipants[false]",
                description: "Exclude the streamer account from the array"
            },
            {
                usage: "sharedChatParticipants[true, username]",
                description: "Return an array of participant usernames, including the streamer account."
            },
            {
                usage: "sharedChatParticipants[false, displayName]",
                description: "Return an array of participant display names, excluding the streamer account."
            },
            {
                usage: "sharedChatParticipants[true, userId]",
                description: "Return an array of participant user IDs, including the streamer account."
            }
        ],
        categories: ["common", "trigger based"],
        possibleDataOutput: ["array"]
    },
    evaluator: (trigger: Trigger, includeStreamer = true, filterType = "raw") => {
        const participants = Object.values(SharedChatCache.participants);
        if (!includeStreamer || includeStreamer === "false") {
            const streamerId = AccountAccess.getAccounts().streamer.userId;
            if (!streamerId) {
                return participants;
            }
            return participants.filter(p => p.broadcasterId !== streamerId);
        }

        if (filterType === "username") {
            return participants.map(p => p.broadcasterName);
        }

        if (filterType === "displayName") {
            return participants.map(p => p.broadcasterDisplayName);
        }

        if (filterType === "userId") {
            return participants.map(p => p.broadcasterId);
        }

        return participants.map(p => ({
            userId: p.broadcasterId,
            username: p.broadcasterName,
            displayName: p.broadcasterDisplayName
        }));
    }
};

export default model;