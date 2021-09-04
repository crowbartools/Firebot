"use strict";

const accountAccess = require("../../common/account-access");
const twitchApi = require("../client");

const getTeams = async (broadcasterId) => {
    const client = twitchApi.getClient();
    const teams = await client.kraken.channels.getChannelTeams(broadcasterId);

    if (teams == null) {
        return null;
    }

    return teams;
};

const getMatchingTeams = async (userId) => {
    const streamer = accountAccess.getAccounts().streamer;
    const streamerTeams = await getTeams(streamer.userId);
    const userTeams = await getTeams(userId);

    if (streamerTeams == null || userTeams == null) {
        return null;
    }

    const teams = [];
    for (const streamerTeam of streamerTeams) {
        for (const userTeam of userTeams) {
            if (streamerTeam.id === userTeam.id) {
                teams.push(streamerTeam);
            }
        }
    }

    return teams;
};

const getMatchingTeamsByName = async (username) => {
    const client = twitchApi.getClient();
    const user = await client.helix.users.getUserByName(username);
    const teams = await getMatchingTeams(user.id);

    if (teams == null) {
        return null;
    }

    return teams;
};

const getMatchingTeamsById = async (userId) => {
    const teams = await getMatchingTeams(userId);

    if (teams == null) {
        return null;
    }

    return teams;
};

const getStreamerTeams = async () => {
    const streamer = accountAccess.getAccounts().streamer;
    const streamerTeams = await getTeams(streamer.userId);

    if (streamerTeams == null) {
        return null;
    }

    return streamerTeams;
};

exports.getMatchingTeamsByName = getMatchingTeamsByName;
exports.getMatchingTeamsById = getMatchingTeamsById;
exports.getStreamerTeams = getStreamerTeams;