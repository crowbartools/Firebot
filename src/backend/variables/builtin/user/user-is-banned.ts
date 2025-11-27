import type { ReplaceVariable } from "../../../../types/variables";
import { TwitchApi } from "../../../streaming-platforms/twitch/api";

const UserIsBannedVariable: ReplaceVariable = {
    definition: {
        handle: "userIsBanned",
        usage: "userIsBanned[username]",
        description: "Returns `true` if the specified user is currently banned (not just timed out), otherwise returns `false`.",
        categories: ["common", "user based"],
        possibleDataOutput: ["text", "bool"]
    },
    evaluator: async (trigger, username: string) => {
        if (username == null || username === "") {
            return false;
        }

        const user = await TwitchApi.users.getUserByName(username);
        if (user == null) {
            return false;
        }

        return (await TwitchApi.moderation.isUserBanned(user.id)) ?? false;
    }
};

export default UserIsBannedVariable;