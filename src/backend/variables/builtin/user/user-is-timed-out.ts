import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import twitchApi from "../../../twitch-api/api";

const UserIsTimedOutVariable: ReplaceVariable = {
    definition: {
        handle: "userIsTimedOut",
        usage: "userIsTimedOut[username]",
        description: "Returns `true` if the specified user is currently timed out, otherwise returns `false`.",
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER, VariableCategory.USER],
        possibleDataOutput: [OutputDataType.TEXT, OutputDataType.BOOLEAN]
    },
    evaluator: async (trigger, username: string) => {
        if (username == null || username === "") {
            return false;
        }

        const user = await twitchApi.users.getUserByName(username);
        if (user == null) {
            return false;
        }

        return (await twitchApi.moderation.isUserTimedOut(user.id)) ?? false;
    }
};

export default UserIsTimedOutVariable;