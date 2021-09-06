"use strict";

const twitchApi = require("../twitch-api/api");
const frontendCommunicator = require("../common/frontend-communicator");
const accountAccess = require("../common/account-access");

/**
 * @typedef MappedTeamRole
 * @property {string} id
 * @property {string} name
 */

/** @returns {MappedTeamRole} */
const mapRoles = (teams) => {
    return teams
        .map(team => {
            return {
                id: parseInt(team.id), // For compatibility (Kraken API returned an int)
                name: team.displayName
            };
        });
};

/** @returns {Promise.<MappedTeamRole[]>} */
const getAllTeamRolesForViewer = async (username) => {
    const client = twitchApi.getClient();
    const user = await client.helix.users.getUserByName(username);
    const streamerTeams = await client.helix.teams.getTeamsForBroadcaster(accountAccess.getAccounts().streamer.userId);

    if (streamerTeams == null) return null;

    const teams = [];
    for (const team of streamerTeams) {
        const relations = await team.getUserRelations();
        for (const relation of relations) {
            if (relation.id === user.id) {
                teams.push(team);
            }
        }
    }

    return mapRoles(teams);
};

/** @returns {Promise.<MappedTeamRole[]>} */
const getTeamRoles = async () => {
    const client = twitchApi.getClient();
    const teams = await client.helix.teams.getTeamsForBroadcaster(accountAccess.getAccounts().streamer.userId);

    if (teams != null) {
        return mapRoles(teams);
    }
};

frontendCommunicator.onAsync("getTeamRoles", async () => {
    const roles = await getTeamRoles();

    if (roles != null) {
        return roles;
    }
});

exports.getTeamRoles = getTeamRoles;
exports.getAllTeamRolesForViewer = getAllTeamRolesForViewer;