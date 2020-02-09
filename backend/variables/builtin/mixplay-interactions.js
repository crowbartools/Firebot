"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");

const viewerDB = require('../../database/userDatabase');

const model = {
    definition: {
        handle: "mixplayInteractions",
        usage: "mixplayInteractions[username]",
        description: "Displays the number of mixplay interactions for a viewer (leave blank to use current viewer)",
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async (trigger, username) => {
        if (username == null) {
            username = trigger.metadata.username;
        }
        let viewer = await viewerDB.getUserByUsername(trigger.metadata.username);
        if (!viewer) {
            return 0;
        }
        return viewer.mixplayInteractions || 0;
    }
};

module.exports = model;
