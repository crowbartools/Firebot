"use strict";

const logger = require("../logwrapper");
const firebotRoles = require("../../shared/firebot-roles");
const activeChatters = require("../chat/active-chatters");

function userIsInFirebotRole(role, username) {
    switch (role.id) {
    case "ActiveChatters":
        return activeChatters.isUsernameActiveChatter(username);
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










