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
 *
 * @param {string} username
 */
async function getAllRolesForViewerNameSpaced(username) {
    return {
        twitchRoles: (await chatRolesManager.getUsersChatRoles(username)).map(twitchRolesManager.mapTwitchRole),
        firebotRoles: firebotRolesManager.getAllFirebotRolesForViewer(username),
        customRoles: customRolesManager.getAllCustomRolesForViewer(username),
        teamRoles: await teamRolesManager.getAllTeamRolesForViewer(username)
    };
}

/**
 * Check if user has the given role its id
 * @param {string} username
 * @param {string} expectedRoleName
 */
async function viewerHasRole(username, expectedRoleId) {
    const viewerRoles = await getAllRolesForViewer(username);
    return viewerRoles.some(r => r.id === expectedRoleId);
}

/**
 * Check if user has the given role by name
 * @param {string} username
 * @param {string} roleName
 */
async function viewerHasRoleByName(username, expectedRoleName) {
    const viewerRoles = await getAllRolesForViewer(username);
    return viewerRoles.some(r => r.name === expectedRoleName);
}


/**
 * Check if user has the given roles by their ids
 * @param {string} username
 * @param {string[]} expectedRoleIds
 */
async function viewerHasRoles(username, expectedRoleIds) {
    const viewerRoles = await getAllRolesForViewer(username);
    return expectedRoleIds.every(n => viewerRoles.some(r => r.id === n));
}

/**
 * Check if user has the given roles by their names
 * @param {string} username
 * @param {string[]} expectedRoleNames
 */
async function viewerHasRolesByName(username, expectedRoleNames) {
    const viewerRoles = await getAllRolesForViewer(username);
    return expectedRoleNames.every(n => viewerRoles.some(r => r.name === n));
}

exports.getAllRolesForViewer = getAllRolesForViewer;
exports.getAllRolesForViewerNameSpaced = getAllRolesForViewerNameSpaced;
exports.viewerHasRoles = viewerHasRoles;
exports.viewerHasRolesByName = viewerHasRolesByName;
exports.viewerHasRole = viewerHasRole;
exports.viewerHasRoleByName = viewerHasRoleByName;