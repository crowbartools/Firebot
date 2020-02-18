"use strict";

const logger = require("../logwrapper");
const firebotRoles = require("../../shared/firebot-roles");

const ActiveChatters = require("./role-managers/active-chatters");
const ActiveMixplayUsers = require('./role-managers/active-mixplay-users');

function userIsInFirebotRole(role, username) {
    switch (role.id) {
    case "ActiveChatters":
        return ActiveChatters.isUsernameActiveChatter(username);
    case "ActiveMixplayUsers":
        return ActiveMixplayUsers.isUsernameActiveUser(username);
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










