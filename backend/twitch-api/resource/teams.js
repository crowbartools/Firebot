"use strict";

const accountAccess = require("../../common/account-access");
const twitchApi = require("../api");

async function getTeams(broadcasterId) {
    const client = twitchApi.getOldClient();
    const teams = await client.kraken.channels.getChannelTeams(broadcasterId);

    if (teams == null) {
        return null;
    }

    return teams;
}

async function getMatchingTeams(userId) {
    const streamer = accountAccess.getAccounts().streamer;
    const streamerTeams = await getTeams(streamer.userId);
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
    const user = await client.users.getUserByName(username);
    const teams = await getMatchingTeams(user.id);

    if (teams == null) {
        return null;
    }

    return teams;
}

async function getMatchingTeamsById(userId) {
    const teams = await getMatchingTeams(userId);

    if (teams == null) {
        return null;
    }

    return teams;
}

async function getStreamerTeams() {
    const streamer = accountAccess.getAccounts().streamer;
    const streamerTeams = await getTeams(streamer.userId);

    if (streamerTeams == null) {
        return null;
    }

    return streamerTeams;
}

exports.getMatchingTeamsByName = getMatchingTeamsByName;
exports.getMatchingTeamsById = getMatchingTeamsById;
exports.getStreamerTeams = getStreamerTeams;