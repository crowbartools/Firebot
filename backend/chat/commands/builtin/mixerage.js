"use strict";

const channelAccess = require("../../../common/channel-access");
const moment = require("moment");
const chat = require("../../chat");
const util = require("../../../utility");

/**
 * The Uptime command
 */
const uptime = {
    definition: {
        id: "firebot:mixerage",
        name: "Mixer Age",
        active: true,
        trigger: "!mixerage",
        description: "Displays how long the user has been on Mixer.",
        autoDeleteTrigger: false,
        scanWholeMessage: false,
        cooldown: {
            user: 0,
            global: 0
        }
    },
    /**
   * When the command is triggered
   */
    onTriggerEvent: async event => {
        let commandSender = event.userCommand.commandSender;

        let userDetails = await channelAccess.getMixerAccountDetailsByUsername(
            commandSender
        );

        if (userDetails === null) {
            chat.sendChatMessage(`${commandSender} not found.`);
        } else {
            let joinedMixerDateMoment = moment(userDetails.createdAt),
                nowMoment = moment();

            let joinedMixerString = util.getDateDiffString(
                joinedMixerDateMoment,
                nowMoment
            );

            chat.sendChatMessage(
                `${commandSender} joined Mixer ${joinedMixerString} ago on ${joinedMixerDateMoment.format(
                    "DD MMMM YYYY HH:mm"
                )} UTC`
            );
        }
    }
};

module.exports = uptime;
