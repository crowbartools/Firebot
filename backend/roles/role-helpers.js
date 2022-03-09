"use strict";

const firebotRolesManager = require("./firebot-roles-manager");
const customRolesManager = require("./custom-roles-manager");
const teamRolesManager = require("./team-roles-manager");
const twitchRolesManager = require("../../shared/twitch-roles");
const chatRolesManager = require("./chat-roles-manager");

/**
 *
 * @param {string} username
 * @returns {Promise<Array<{ id: string; name: string}>>}
 */
async function getAllRolesForViewer(username) {
    const userTwitchRoles = (await chatRolesManager.getUsersChatRoles(username))
        .map(twitchRolesManager.mapTwitchRole);
    const userFirebotRoles = firebotRolesManager.getAllFirebotRolesForViewer(username);
    const userCustomRoles = customRolesManager.getAllCustomRolesForViewer(username);
    const userTeamRoles = await teamRolesManager.getAllTeamRolesForViewer(username);

    return [
        ...userTwitchRoles,
        ...userFirebotRoles,
        ...userCustomRoles,
        ...userTeamRoles
    ];
}

/**
 * Check if user has the given roles by their ids
 * @param {string} username
 * @param {string[]} roleIds
 */
async function viewerHasRoles(username, roleIds) {
    const viewerRoles = await getAllRolesForViewer(username);
    return viewerRoles.some(r => roleIds.includes(r.id));
}

/**
 * Check if user has the given roles by their names
 * @param {string} username
 * @param {string[]} roleNames
 */
async function viewerHasRolesByName(username, roleNames) {
    const viewerRoles = await getAllRolesForViewer(username);
    return viewerRoles.some(r => roleNames.includes(r.name));
}

exports.getAllRolesForViewer = getAllRolesForViewer;
exports.viewerHasRoles = viewerHasRoles;
exports.viewerHasRolesByName = viewerHasRolesByName;