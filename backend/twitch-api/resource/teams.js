"use strict";

const accountAccess = require("../../common/account-access");
const twitchApi = require("../client");

async function getTeams(broadcasterId) {
    const client = twitchApi.getClient();
    const teams = await client.kraken.channels.getChannelTeams(broadcasterId);

    if (teams == null) {
        return null;
    }

    return teams;
}

async function getMatchingTeams(userId) {
    const streamer = accountAccess.getAccounts().streamer;
    const streamerTeams = await getTeams(streamer.id);
    const userTeams = await getTeams(userId);

    if (streamerTeams == null || userTeams == null) {
        return null;
    }

    const teams = [];
    for (let streamerTeam of streamerTeams) {
        for (let userTeam of userTeams) {
            if (streamerTeam.id === userTeam.id) {
                teams.push(streamerTeam);
            }
        }
    }

    return teams;
}

async function getMatchingTeamsByName(username) {
    const client = twitchApi.getClient();
    const userId = (await client.helix.users.getUserByName(username)).id;
    const teams = getMatchingTeams(userId);
    
    if (teams == null) {
        return null;
    }

    return teams;
}

async function getMatchingTeamsById(userId) {
    const teams = getMatchingTeams(userId);
    
    if (teams == null) {
        return null;
    }

    return teams;
}

async function getStreamerTeams() {
    const streamerTeams = await getTeams(streamer.id);

    return streamerTeams;
}

exports.getMatchingTeamsByName = getMatchingTeamsByName;
exports.getMatchingTeamsById = getMatchingTeamsById;
exports.getStreamerTeams = getStreamerTeams;