import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import { TwitchApi } from "../../../streaming-platforms/twitch/api";

const UserIsBannedVariable: ReplaceVariable = {
    definition: {
        handle: "userIsBanned",
        usage: "userIsBanned[username]",
        description: "Returns `true` if the specified user is currently banned (not just timed out), otherwise returns `false`.",
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER, VariableCategory.USER],
        possibleDataOutput: [OutputDataType.TEXT, OutputDataType.BOOLEAN]
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