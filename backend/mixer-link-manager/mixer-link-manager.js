'use strict';

const logger = require('../logwrapper');
const NodeCache = require("node-cache");

const userDatabase = require("../database/userDatabase");

// cache link requests for 60 secs
const linkRequestCache = new NodeCache({ stdTTL: 60, checkperiod: 10 });

async function verifyAndGetUsers(twitchUsername, mixerUsername) {
    const twitchUser = await userDatabase.getTwitchUserByUsername(twitchUsername);
    if (twitchUser == null) {
        throw new Error(`Twitch user '${twitchUsername}' not found in Firebot data`);
    }

    const mixerUser = await userDatabase.getMixerUserByUsername(mixerUsername);
    if (mixerUser == null) {
        throw new Error(`Mixer user '${mixerUsername}' not found in Firebot data`);
    }
    return [twitchUser, mixerUser];
}

/**
 * Add a link request
 * @param {string} twitchUsername
 * @param {string} mixerUsername
 */
async function addLinkRequest(twitchUsername, mixerUsername) {
    twitchUsername = twitchUsername.toLowerCase();
    mixerUsername = mixerUsername.toLowerCase();

    // throws an error if either the twitch or mixer user doesnt exist in firebot
    const [twitchUser] = await verifyAndGetUsers(twitchUsername, mixerUsername);

    if (twitchUser.mixerLink != null) {
        throw new Error(`Twitch user '${twitchUsername}' has already been linked with a previous Mixer account.`);
    }

    linkRequestCache.set(twitchUsername, mixerUsername);
}

/**
 * Check if a link request exists for a given twitch user.
 * @param {string} twitchUsername
 * @returns {boolean}
 */
function linkRequestExists(twitchUsername = "") {
    twitchUsername = twitchUsername.toLowerCase();
    return linkRequestCache.get(twitchUsername) != null;
}

/**
 * Approve a link request
 * @param {string} twitchUsername
 * @returns {Promise<boolean>} Returns true if successfully linked, returns false no request is present for given twitch name.
 */
async function approveLinkRequest(twitchUsername, moderatorName) {
    twitchUsername = twitchUsername.toLowerCase();

    if (!linkRequestExists(twitchUsername)) {
        return false;
    }

    const mixerUsername = linkRequestCache.get(twitchUsername);

    linkRequestCache.del(twitchUsername);

    const [twitchUser, mixerUser] = await verifyAndGetUsers(twitchUsername, mixerUsername);

    if (twitchUser.mixerLink != null) {
        throw new Error(`Twitch user '${twitchUsername}' has already been linked with a previous Mixer account.`);
    }

    twitchUser.mixerLink = {
        mixerUsername: mixerUser.username,
        approvedBy: moderatorName,
        linkedAt: Date.now(),
        mixerData: mixerUser
    };

    // merge values
    twitchUser.onlineAt = mixerUser.onlineAt;
    twitchUser.lastSeen = mixerUser.lastSeen;
    twitchUser.joinDate = mixerUser.joinDate;

    twitchUser.disableAutoStatAccrual = mixerUser.disableAutoStatAccrual;
    twitchUser.disableActiveUserList = mixerUser.disableActiveUserList;

    twitchUser.minutesInChannel += mixerUser.minutesInChannel;
    twitchUser.chatMessages += mixerUser.chatMessages;

    if (mixerUser.currency != null) {
        if (twitchUser.currency == null) {
            twitchUser.currency = {};
        }
        for (const [currencyId, mixerAmount] of Object.entries(mixerUser.currency)) {
            if (twitchUser.currency[currencyId] != null) {
                twitchUser.currency[currencyId] += mixerAmount;
            } else {
                twitchUser.currency[currencyId] = mixerAmount;
            }
        }
    }

    await userDatabase.updateUser(twitchUser);

    await userDatabase.removeUser(mixerUser._id);

    return true;
}

/**
 * Deny a link request
 * @param {string} twitchUsername
 * @returns {boolean} Returns true if successfully denied, returns false no request is present for given twitch name.
 */
function denyLinkRequest(twitchUsername) {
    twitchUsername = twitchUsername.toLowerCase();

    if (!linkRequestExists(twitchUsername)) {
        return false;
    }

    linkRequestCache.del(twitchUsername);

    return true;
}

exports.addLinkRequest = addLinkRequest;
exports.linkRequestExists = linkRequestExists;
exports.approveLinkRequest = approveLinkRequest;
exports.denyLinkRequest = denyLinkRequest;