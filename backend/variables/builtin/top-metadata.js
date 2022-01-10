// Migration: info - Needs implementation details

"use strict";

const { OutputDataType } = require("../../../shared/variable-constants");

const userDatabase = require("../../database/userDatabase");
const util = require("../../utility");

const model = {
    definition: {
        handle: "topMetadata",
        description: "Comma seperated list of users with the most of the given metadata key. Defaults to top 10, you can provide a custom number as a second argument.",
        usage: "topMetadata[metadataKey]",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (_, metadataKey, count = 10) => {

        if (metadataKey == null) {
            return "[Invalid metadata key]";
        }

        // limit to max of 50
        if (count > 50) {
            count = 50;
        } else if (count < 1) {
            // min of 1
            count = 1;
        }

        let topMetadataUsers = await userDatabase.getTopMetadata(metadataKey, count);

        let topUsersDisplay = topMetadataUsers.map((u, i) => {
            return `#${i + 1}) ${u.displayName} - ${util.commafy(u.metadata[metadataKey])}`;
        }).join(", ");

        return topUsersDisplay;
    }
};

module.exports = model;
