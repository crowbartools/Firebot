"use strict";

const { OutputDataType } = require("../../../shared/variable-contants");
const apiAccess = require("../../api-access");
const accountAccess = require("../../common/account-access");
const logger = require("../../logwrapper");

const model = {
    definition: {
        handle: "costreamChannels",
        description: "Lists the channels you are currently costreaming with.",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (_, dontIncludeAt = false) => {
        let streamerAccount = accountAccess.getAccounts().streamer;
        try {
            let streamerChannel = await apiAccess.get(`channels/${streamerAccount.username}`);

            if (streamerChannel.costreamId != null) {
                let costream = await apiAccess.get(`costreams/${streamerChannel.costreamId}`);
                if (costream && costream.channels) {
                    let names = costream.channels
                        .filter(c => c.token !== streamerAccount.username)
                        .map(c => {
                            return (dontIncludeAt ? "" : "@") + c.token;
                        });

                    return names.join(", ");
                }
            }
        } catch (err) {
            logger.warn("failed to get costream info: ", err);
        }
        return "[No Costream Found]";
    }
};

module.exports = model;
