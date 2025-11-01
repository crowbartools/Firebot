import type { ReplaceVariable } from "../../../../types/variables";
import { TwitchApi } from "../../../streaming-platforms/twitch/api";

const UserIsTimedOutVariable: ReplaceVariable = {
    definition: {
        handle: "userIsTimedOut",
        usage: "userIsTimedOut[username]",
        description: "Returns `true` if the specified user is currently timed out, otherwise returns `false`.",
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

        return (await TwitchApi.moderation.isUserTimedOut(user.id)) ?? false;
    }
};

export default UserIsTimedOutVariable;