"use strict";

const rolesManager = require("../../../roles/custom-roles-manager");

function countEmojis(str) {
    const re = /\p{Extended_Pictographic}/ug; //eslint-disable-line
    return ((str || '').match(re) || []).length;
}

function moderate(chatMessage, settings, moderated) {
    const userExempt = rolesManager.userIsInRole(chatMessage.username, chatMessage.roles, settings.exemptRoles);

    if (userExempt) {
        moderated(false);
        return;
    }

    const chat = require("../../twitch-chat");

    const emoteCount = chatMessage.parts.filter(p => p.type === "emote").length;
    const emojiCount = chatMessage.parts
        .filter(p => p.type === "text")
        .reduce((acc, part) => acc + countEmojis(part.text), 0);
    if ((emoteCount + emojiCount) > settings.max) {
        chat.deleteMessage(chatMessage.id);
        moderated(true);
    }

    moderated(false);
}

exports.moderate = moderate;