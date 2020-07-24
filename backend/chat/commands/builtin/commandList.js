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
        const twitchChat = require("../../../chat/twitch-chat");
        
        let profileJSON = {
            username: event.chatMessage.username,
            userRoles: event.chatMessage.roles,
            profilePage: 'commands'
        };

        let binId = await cloudSync.syncProfileData(profileJSON);

        if (binId == null) {
            twitchChat.sendChatMessage(
                "There are no commands that you are allowed to run.",
                event.userCommand.commandSender
            );
        } else {
            twitchChat.sendChatMessage(
                `Here is a list of the commands you can use. https://firebot.app/profile?id=${binId}`,
                event.userCommand.commandSender
            );
        }
    }
};

module.exports = commandList;
