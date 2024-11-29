import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType } from "../../../../shared/variable-constants";

import viewerMetadataManager from "../../../viewers/viewer-metadata-manager";
const util = require("../../../utility");

const model : ReplaceVariable = {
    definition: {
        handle: "topMetadata",
        description: "Comma separated list of users with the most of the given metadata key. Defaults to top 10, you can provide a custom number as a second argument.",
        usage: "topMetadata[metadataKey]",
        examples: [
            {
                usage: "topMetadata[deaths, 5]",
                description: "Returns comma-separated list of top 5 users with their death counts"
            }
        ],
        possibleDataOutput: [OutputDataType.TEXT]
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
            .map((user, idx) => {
                return `#${idx + 1}) ${user.displayName} - ${util.commafy(user.metadata[metadataKey])}`;
            })

            // convert to commafied string
            .join(', ');

        // no one in list: output none
        if (topUsersDisplay === '') {
            return '(none)';
        }

        // return list
        return topUsersDisplay;
    }
};

export default model;
