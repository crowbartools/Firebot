// Migration: info needed

"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");

const viewerDB = require('../../database/userDatabase');

const model = {
    definition: {
        handle: "chatMessages",
        usage: "chatMessages[username]",
        description: "Displays the number of chat messages for a viewer (leave blank to use current viewer)",
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
        return viewer.chatMessages || 0;
    }
};

module.exports = model;
