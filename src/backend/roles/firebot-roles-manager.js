"use strict";

const firebotRoles = require("../../shared/firebot-roles");

const activeChatUsers = require("../chat/chat-listeners/active-user-handler");

function userIsInFirebotRole(role, username) {
    switch (role.id) {
        case "ActiveChatters":
            return activeChatUsers.userIsActive(username);
        default:
            return false;
    }
}

function getAllFirebotRolesForViewer(username) {
    const roles = firebotRoles.getFirebotRoles();
    return roles
        .filter(r => userIsInFirebotRole(r, username) !== false)
        .map(r => {
            return {
                id: r.id,
                name: r.name
            };
        });
}

exports.getAllFirebotRolesForViewer = getAllFirebotRolesForViewer;
