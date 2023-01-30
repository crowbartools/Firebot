"use strict";

const twitchApi = require("../twitch-api/api").default;
const frontendCommunicator = require("../common/frontend-communicator");

let streamerTeams = [];

const loadTeamRoles = async () => {
    const roles = await twitchApi.teams.getStreamerTeams();

    if (!roles.length) {
        streamerTeams = null;
        return;
    }

    roles.forEach(async team => {
        const members = await team.getUserRelations();
        streamerTeams.push({
            mappedRole: {
                id: parseInt(team.id),
                name: team.displayName
            },
            members: members.map(m => m.displayName)
        });
    });
};

const getTeamRoles = async () => {
    if (streamerTeams == null) {
        return [];
    }

    if (!streamerTeams.length) {
        await loadTeamRoles();
    }

    return streamerTeams.map(team => team.mappedRole);
};

const getAllTeamRolesForViewer = async (username) => {
    if (streamerTeams == null) {
        return [];
    }

    const teams = [];
    streamerTeams.forEach(team => {
        if (team.members.some(m => m.toLowerCase() === username.toLowerCase())) {
            teams.push(team.mappedRole);
        }
    });

    return teams;
};

frontendCommunicator.onAsync("getTeamRoles", async () => {
    if (streamerTeams == null) {
        return [];
    }

    const roles = await getTeamRoles();
    return roles;

});

exports.loadTeamRoles = loadTeamRoles;
exports.getTeamRoles = getTeamRoles;
exports.getAllTeamRolesForViewer = getAllTeamRolesForViewer;