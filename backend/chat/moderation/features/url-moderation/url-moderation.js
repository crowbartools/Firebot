"use strict";

const permitCommand = require("./url-permit-command");
const logger = require("../../../../logwrapper");
const rolesManager = require("../../../../roles/custom-roles-manager");

function sendOutputMessage(outputMessage, username) {
    const chat = require("../../../twitch-chat");
    outputMessage = outputMessage.replace("{userName}", username);
    chat.sendChatMessage(outputMessage);
}

async function getViewerViewTime(username) {
    const viewerDB = require('../../database/userDatabase');
    const viewer = await viewerDB.getUserByUsername(username);

    return viewer.minutesInChannel / 60;
}

async function moderate(chatMessage, settings, moderated) {
    if (permitCommand.hasTemporaryPermission(chatMessage.username)) {
        moderated(false);
        return;
    }

    const userExempt = rolesManager.userIsInRole(chatMessage.username, chatMessage.roles, settings.exemptRoles);

    if (userExempt) {
        moderated(false);
        return;
    }

    const message = chatMessage.rawText;
    const regex = new RegExp(/[\w]{2,}[.][\w]{2,}/, "gi");

    if (!regex.test(message)) {
        moderated(false);
        return;
    }

    logger.debug("Url moderation: Found url in message...");

    let outputMessage = settings.outputMessage || "";

    if (settings.viewTime && settings.viewTime.enabled) {
        const viewerViewTime = getViewerViewTime(chatMessage.username);
        const minimumViewTime = settings.viewTime.viewTimeInHours;

        if (viewerViewTime <= minimumViewTime) {
            outputMessage = outputMessage.replace("{viewTime}", minimumViewTime.toString());
        }
    }

    const chat = require("../../../twitch-chat");
    chat.deleteMessage(chatMessage.id);

    if (outputMessage) {
        sendOutputMessage(outputMessage, chatMessage.username);
    }

    moderated(true);
}

exports.moderate = moderate;