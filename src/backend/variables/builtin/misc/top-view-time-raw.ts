import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType } from "../../../../shared/variable-constants";

import viewerOnlineStatusManager from "../../../viewers/viewer-online-status-manager";

const model : ReplaceVariable = {
    definition: {
        handle: "rawTopViewTime",
        description: "Returns a raw array containing users with the most view time (in hours). Items contain `username`, 'place` and `minutes` properties.",
        usage: "rawTopViewTime[count]",
        possibleDataOutput: [OutputDataType.ARRAY]
    },

    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    evaluator: async (_, count: number = 10) => {

        // min of 1
        if (count < 1) {
            count = 1;
        }

        const topViewTimeUsers = await viewerOnlineStatusManager.getTopViewTimeViewers(count);

        return topViewTimeUsers.map((u, i) => ({
            place: i + 1,
            username: u.username,
            userId: u._id,
            userDisplayName: u.displayName,
            minutes: u.minutesInChannel
        }));
    }
};

export default model;
