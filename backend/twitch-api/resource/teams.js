"use strict";

const accountAccess = require("../../common/account-access");
const logger = require("../../logwrapper");
const twitchApi = require("../api");

/**
 * @param {string} broadcasterId
 * @returns {Promise<import("@twurple/api").HelixTeam[]>}
 */
const getTeams = async (broadcasterId) => {
    const client = twitchApi.getClient();

    try {
        const teams = await client.teams.getTeamsForBroadcaster(broadcasterId);

        if (teams != null) {
            return teams;
        }

        return [];
    } catch (error) {
        logger.error("Failed to get teams for broadcaster", error);
        return [];
    }
};

/**
 * @param {string} userId
 * @returns {Promise<import("@twurple/api").HelixTeam[]>}
 */
const getMatchingTeams = async (userId) => {
    const streamer = accountAccess.getAccounts().streamer;
    const streamerTeams = await getTeams(streamer.userId);
    const userTeams = await getTeams(userId);

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

/**
 * @param {string} username
 * @returns {Promise<import("@twurple/api").HelixTeam[]>}
 */
const getMatchingTeamsByName = async (username) => {
    const client = twitchApi.getClient();

    try {
        const user = await client.users.getUserByName(username);

        if (user == null) {
            return null;
        }

        const teams = await getMatchingTeams(user.id);
        if (teams != null) {
            return teams;
        }

        return [];
    } catch (error) {
        logger.error("Failed to get teams for broadcaster", error);
        return [];
    }
};

/**
 * @param {string} userId
 * @returns {Promise<import("@twurple/api").HelixTeam[]>}
 */
const getMatchingTeamsById = async (userId) => {
    const teams = await getMatchingTeams(userId);

    if (teams != null) {
        return teams;
    }

    return [];
};

/**
 * @returns {Promise<import("@twurple/api").HelixTeam[]>}
 */
const getStreamerTeams = async () => {
    const streamer = accountAccess.getAccounts().streamer;
    const streamerTeams = await getTeams(streamer.userId);

    if (streamerTeams != null) {
        return streamerTeams;
    }

    return [];
};

exports.getMatchingTeamsByName = getMatchingTeamsByName;
exports.getMatchingTeamsById = getMatchingTeamsById;
exports.getStreamerTeams = getStreamerTeams;