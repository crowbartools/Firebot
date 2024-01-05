"use strict";
const { OutputDataType } = require("../../../shared/variable-constants");
const userDatabase = require("../../database/userDatabase");
const model = {
    definition: {
        handle: "rawTopViewTime",
        description: "Returns a raw array containing users with the most view time(in hours). Items contain 'username', 'place' and 'minutes' properties",
        usage: "rawTopViewTime[count]",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (_, count = 10) => {

        // min of 1
        if (count < 1) {
            count = 1;
        }

        const topViewTimeUsers = await userDatabase.getTopViewTimeUsers(count);

        return topViewTimeUsers.map((u, i) => ({
            place: i + 1,
            username: u.username,
            minutes: u.minutesInChannel
        }));
    }
};

module.exports = model;
