"use strict";

const accountAccess = require("../../common/account-access");
const twitchApi = require("../api");

/**
 * @param {string} broadcasterId
 * @returns {Promise<import("@twurple/api").HelixTeam[]>}
 */
const getTeams = async (broadcasterId) => {
    const client = twitchApi.getClient();
    const teams = await client.teams.getTeamsForBroadcaster(broadcasterId);

    if (teams == null) {
        return null;
    }

    return teams;
};

/**
 * @param {string} userId
 * @returns {Promise<import("@twurple/api").HelixTeam[]>}
 */
const getMatchingTeams = async (userId) => {
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
};

/**
 * @param {string} username
 * @returns {Promise<import("@twurple/api").HelixTeam[]>}
 */
const getMatchingTeamsByName = async (username) => {
    const client = twitchApi.getClient();
    const user = await client.users.getUserByName(username);
    const teams = await getMatchingTeams(user.id);

    if (teams == null) {
        return null;
    }

    return teams;
};

/**
 * @param {string} userId
 * @returns {Promise<import("@twurple/api").HelixTeam[]>}
 */
const getMatchingTeamsById = async (userId) => {
    const teams = await getMatchingTeams(userId);

    if (teams == null) {
        return null;
    }

    return teams;
};

/**
 * @returns {Promise<import("@twurple/api").HelixTeam[]>}
 */
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