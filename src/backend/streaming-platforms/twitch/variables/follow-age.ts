import moment from "moment";

import type { ReplaceVariable } from "../../../../types/variables";
import { TwitchApi } from "../api";

const model : ReplaceVariable = {
    definition: {
        handle: "followAge",
        usage: "followAge[username]",
        description: "The time a given viewer has been following the channel, in days by default.",
        examples: [
            {
                usage: "followAge[$user]",
                description: "Gets how long the associated user (i.e. who triggered command, pressed button, etc) has been following the channel (in days)."
            },
            {
                usage: "followAge[$target]",
                description: "Gets how long the target user has been following the channel (in days)."
            },
            {
                usage: "followAge[username, unitOfTime]",
                description: "Gets how long the specified username has been following the channel in a specific unit of time (in years, months, days, hours, or minutes)."
            }
        ],
        categories: ["numbers", "user based"],
        possibleDataOutput: ["number"]
    },
    evaluator: async (
        trigger,
        username: string,
        unitOfTime: moment.unitOfTime.Diff = "days"
    ) => {
        username = username == null ? trigger.metadata.username : username;
        if (username == null) {
            return 0;
        }

        try {
            const followDate = await TwitchApi.users.getFollowDateForUser(username);
            if (followDate == null) {
                return 0;
            }

            const followDateMoment = moment(followDate);
            return moment().diff(followDateMoment, unitOfTime);

        } catch {
            return 0;
        }
    }
};

export default model;