// Migration: info - Needs implementation details

"use strict";

const { OutputDataType } = require("../../../shared/variable-constants");

const userDatabase = require("../../database/userDatabase");
const util = require("../../utility");

const model = {
    definition: {
        handle: "topViewTime",
        description: "Comma separated list of users with the most view time (in hours). Defaults to top 10, you can provide a custom number as a second argument.",
        usage: "topViewTime[count]",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (_, count = 10) => {

        // limit to max of 25
        if (count > 25) {
            count = 25;
        } else if (count < 1) {
            // min of 1
            count = 1;
        }

        const topViewTimeUsers = await userDatabase.getTopViewTimeUsers(count);

        const topViewTimeUsersDisplay = topViewTimeUsers.map((u, i) => {
            const hours = u.minutesInChannel > 59 ? Math.floor(u.minutesInChannel / 60) : 0;
            return `#${i + 1}) ${u.username} - ${util.commafy(hours)}`;
        }).join(", ");

        return topViewTimeUsersDisplay;
    }
};

module.exports = model;
