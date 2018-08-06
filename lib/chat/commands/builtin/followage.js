"use strict";

const channelAccess = require("../../../common/channel-access");
const moment = require("moment");
const Chat = require("../../../common/mixer-chat");
const util = require("../../../utility");

/**
 * The Uptime command
 */
const uptime = {
  definition: {
    id: "firebot:followage",
    name: "Followage",
    active: true,
    trigger: "!followage",
    description: "Displays how long the user has been following the channel.",
    autoDeleteTrigger: false,
    scanWholeMessage: false,
    cooldown: {
      user: 0,
      global: 0
    },
    permission: {
      type: "none"
    }
  },
  /**
   * When the command is triggered
   */
  onTriggerEvent: event => {
    return new Promise(async (resolve, reject) => {
      let commandSender = event.userCommand.commandSender;

      let followDate = await channelAccess.getFollowDateForUser(commandSender);

      if (followDate === null) {
        Chat.smartSend(`${commandSender} is not following the channel.`);
      } else {
        let followDateMoment = moment(followDate),
          nowMoment = moment();

        let followAgeString = util.getDateDiffString(
          followDateMoment,
          nowMoment
        );

        Chat.smartSend(
          `${commandSender} has been following for ${followAgeString}`
        );
      }
    });
  }
};

module.exports = uptime;
