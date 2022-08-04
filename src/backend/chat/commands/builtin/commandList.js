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
        description: "Displays link to your profile page with all available commands.",
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

        const profileJSON = {
            username: event.chatMessage.username,
            userRoles: event.chatMessage.roles,
            profilePage: 'commands'
        };

        const binId = await cloudSync.syncProfileData(profileJSON);

        if (binId == null) {
            twitchChat.sendChatMessage(
                `${event.chatMessage.username}, there are no commands that you are allowed to run.`, null, "Bot");
        } else {
            twitchChat.sendChatMessage(
                `You can view the list of commands here: https://firebot.app/profile?id=${binId}`, null, "Bot");
        }
    }
};

module.exports = commandList;
