import chatMessageVariables from "./message";
import chatModeVariables from "./mode";
import moderationVariables from "./moderation";
import pinnedMessageVariables from "./pinned-message";
import sharedChatVariables from "./shared-chat";
import watchStreakVariables from "./watch-streak";

export default [
    ...chatMessageVariables,
    ...chatModeVariables,
    ...moderationVariables,
    ...pinnedMessageVariables,
    ...sharedChatVariables,
    ...watchStreakVariables
];