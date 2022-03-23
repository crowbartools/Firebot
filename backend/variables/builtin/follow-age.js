"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const api = require("../../twitch-api/api");
const moment = require("moment");

const model = {
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
        categories: [VariableCategory.NUMBERS, VariableCategory.USER],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async (trigger, username, unitOfTime = "days") => {
        let age = 0;

        if (username === null) {
            username = trigger.metadata.username;
            if (username === null) {
                return age;
            }
        }

        try {
            let followDate = await api.users.getFollowDateForUser(username);
    
            if (followDate === null) {
                age = 0;
            } else {
                const followDateMoment = moment(followDate),
                    nowMoment = moment();
    
                age = nowMoment.diff(followDateMoment, unitOfTime);
            }
        } catch {
            return age;
        }

        return age;
    }
};

module.exports = model;