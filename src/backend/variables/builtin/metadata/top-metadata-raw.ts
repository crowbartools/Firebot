import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType } from "../../../../shared/variable-constants";

import viewerMetadataManager from "../../../viewers/viewer-metadata-manager";

const model : ReplaceVariable = {
    definition: {
        handle: "rawTopMetadata",
        description: "Returns a raw array of users with the most of a given metadata key. Items contain `username`, `place` and `amount` properties.",
        usage: "rawTopMetadata[metadataKey]",
        possibleDataOutput: [OutputDataType.ARRAY, OutputDataType.TEXT]
    },

    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    evaluator: async (_, metadataKey: string, count: number = 10) => {

        if (metadataKey == null) {
            return "[Invalid metadata key]";
        }

        // limit to max of 50
        if (count > 50) {
            count = 50;
        } else if (count < 1) {
            // min of 1
            count = 1;
        } else if (typeof count !== 'number') {
            count = parseInt(count, 10);
        }

        const topMetadataUsers = await viewerMetadataManager.getTopMetadata(metadataKey, count);

        const topUsersDisplay = topMetadataUsers
            // filter out any results not containing key in metadata
            .filter(user => (user.metadata && user.metadata[metadataKey] != null))

            // map each entry to #position) name - amount
            .map((user, idx) => ({
                place: idx + 1,
                username: user.username,
                userId: user._id,
                userDisplayName: user.displayName,
                amount: user.metadata[metadataKey]
            }));


        // return list
        return topUsersDisplay;
    }
};

export default model;
