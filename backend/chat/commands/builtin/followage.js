"use strict";

const channelAccess = require("../../../common/channel-access");
const moment = require("moment");
const chat = require("../../chat");
const util = require("../../../utility");

/**
 * The Uptime command
 */
const followage = {
    definition: {
        id: "firebot:followage",
        name: "Follow Age",
        active: true,
        trigger: "!followage",
        description: "Displays how long the user has been following the channel.",
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

        let followDate = await channelAccess.getFollowDateForUser(commandSender);

        if (followDate === null) {
            chat.sendChatMessage(`${commandSender} is not following the channel.`);
        } else {
            let followDateMoment = moment(followDate),
                nowMoment = moment();

            let followAgeString = util.getDateDiffString(
                followDateMoment,
                nowMoment
            );

            chat.sendChatMessage(
                `${commandSender} followed ${followAgeString} ago on ${followDateMoment.format(
                    "DD MMMM YYYY HH:mm"
                )} UTC`
            );
        }
    }
};

module.exports = followage;
