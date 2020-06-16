"use strict";

const logger = require("../../../logwrapper");
const accountAccess = require("../../../common/account-access");
const chatModerationManager = require("../../../chat/moderation/chat-moderation-manager");
const commandHandler = require("../../../chat/commands/commandHandler");

module.exports = {
    accountType: "streamer",
    event: "ChatMessage",
    callback: async (data) => {
        const chatProcessor = require("../../../common/handlers/chatProcessor.js");
        const eventManager = require("../../../events/EventManager");
        const timerManager = require("../../../timers/timer-manager");

        //Send to chat moderation service
        chatModerationManager.moderateMessage(data);

        // Send to command router to see if we need to act on a command.
        commandHandler.handleChatEvent(data).catch(reason => {
            logger.error("Could not check for command in chat message.", reason);
        });

        logger.debug("Recieved chat", data);

        let chatFromStreamerChannel = accountAccess.getAccounts().streamer.channelId === data.channel;

        eventManager.triggerEvent("mixer", "chat-message", {
            username: data.user_name,
            data: data,
            originatedInStreamerChannel: chatFromStreamerChannel
        });

        if (data.message.meta.whisper === true) {
            if (data.user_name !== accountAccess.getAccounts().bot.username) {
                // Send to UI to show in chat window.
                chatProcessor.uiChatMessage(data);
            }
        } else {
            chatProcessor.uiChatMessage(data);

            eventManager.triggerEvent("mixer", "viewer-arrived", {
                username: data.user_name,
                data: data,
                originatedInStreamerChannel: chatFromStreamerChannel
            });

            const activeChatter = require('../../../roles/role-managers/active-chatters');
            // Updates or adds user to our active chatter list.
            activeChatter.addOrUpdateActiveChatter(data);

            if (data.user_name !== accountAccess.getAccounts().streamer.username &&
                        data.user_name !== accountAccess.getAccounts().bot.username) {
                timerManager.incrementChatLineCounters();
            }
        }

        // send skill event if needed
        if (data.message && data.message.meta && data.message.meta["is_skill"]) {
            let skill = data.message.meta.skill;

            let skillMessage = "";
            if (data.message.message) {
                data.message.message.forEach(m => {
                    if (m.type === "text") {
                        skillMessage += m.text;
                    }
                });
            }

            // This may change at a later date. Also we may find a better way to determine Skill type once
            // we get more documentation
            skill.isSticker = true;

            eventManager.triggerEvent("mixer", "skill", {
                username: data.user_name,
                data: {
                    skill: skill,
                    skillMessage: skillMessage
                },
                originatedInStreamerChannel: chatFromStreamerChannel
            });

            if (chatFromStreamerChannel) {
                renderWindow.webContents.send('eventlog', {
                    type: "general",
                    username: data.user_name,
                    event: `sent the Sticker "${skill.skill_name}" Cost: ${skill.cost} ${skill.currency}`
                });
            }
        }

        const userdb = require("../../../database/userDatabase");
        // make sure user is in DB
        await userdb.setChatUserOnline({
            id: data.user_id,
            username: data.user_name,
            roles: data.user_roles
        });

        // Increment Chat Messages in user DB.
        await userdb.incrementDbField(data.user_id, "chatMessages");
    }
};