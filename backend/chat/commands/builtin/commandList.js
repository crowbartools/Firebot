"use strict";

/**
 * The Command List command
 */
const commandList = {
    definition: {
        id: "firebot:commandlist",
        name: "Command List",
        active: true,
        trigger: "!commands",
        description: "Whispers a list of all commands the user has permission to run.",
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
        const cloudSync = require('../../../cloud-sync/profile-sync.js');
        const Chat = require("../../../common/mixer-chat");

        let profileJSON = {
            username: event.chatEvent.user_name,
            userRoles: event.chatEvent.user_roles,
            profilePage: 'quotes'
        };

        let binId = await cloudSync.syncProfileData(profileJSON);

        if (binId == null) {
            Chat.smartSend(
                "There are no commands that you are allowed to run.",
                event.userCommand.commandSender
            );
        } else {
            Chat.smartSend(
                `Here a list of the commands you can use. https://crowbartools.com/tools/firebot/profile?id=${binId}`,
                event.userCommand.commandSender
            );
        }
    }
};

module.exports = commandList;
