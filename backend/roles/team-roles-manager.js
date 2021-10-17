"use strict";

const twitchApi = require("../twitch-api/api");
const frontendCommunicator = require("../common/frontend-communicator");

/**
 * @param {import('twitch/lib/API/Kraken/Team/Team').Team[]} teams
 */
function mapRoles(teams) {
    return teams
        .map(team => {
            return {
                id: parseInt(team.id),
                name: team.displayName
            };
        });
}

async function getAllTeamRolesForViewer(username) {
    const roles = await twitchApi.teams.getMatchingTeamsByName(username);

    return mapRoles(roles);
}

async function getTeamRoles() {
    const teams = await twitchApi.teams.getStreamerTeams();

    if (teams == null) {
        return null;
    }

    return mapRoles(teams);
}

frontendCommunicator.onAsync("getTeamRoles", async () => {
    const roles = await getTeamRoles();

    if (roles == null) {
        return null;
    }

    return roles;

});

exports.getTeamRoles = getTeamRoles;
exports.getAllTeamRolesForViewer = getAllTeamRolesForViewer;