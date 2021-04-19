"use strict";

const twitchApi = require("../client");

async function getAllTeamRolesForViewer(username) {
    const client = twitchApi.getClient();
    const roles = await client.teams.getMatchingTeamsByUsername(username);
    
    return roles
        .map(role => {
            return {
                id: role.id,
                name: role.displayName
            };
        });
}

exports.getAllTeamRolesForViewer = getAllTeamRolesForViewer;