"use strict";

const profileManager = require("./profile-manager");
const logger = require("../logwrapper");
const frontendCommunicator = require("./frontend-communicator");
const authManager = require("../auth/auth-manager");
const EventEmitter = require("events");

/**@type {NodeJS.EventEmitter} */
const accountEvents = new EventEmitter();

/**
 * A streamer or bot account
 * @typedef {Object} AuthDetails
 * @property {string} access_token - The access token
 * @property {string} token_type - The type of access token
 * @property {string} expires_at - JSON representation of when access token expires
 * @property {string} refresh_token - The refresh token
 */


/**
 * A streamer or bot account
 * @typedef {Object} FirebotAccount
 * @property {string} username - The account username
 * @property {number} userId - The user id for the account
 * @property {number} channelId - The channel id for the account
 * @property {string} avatar - The avatar url for the account
 * @property {string} subBadge - The sub badge url for the account
 * @property {boolean} partnered - If the channel is partnered
 * @property {boolean} canClip - If the channel can clip
 * @property {AuthDetails} auth - Auth token details for the account
 * @property {boolean} loggedIn - If the account is linked/logged in
 */


/**
 * A streamer and bot account cache
 * @class
 * @param {FirebotAccount} streamer - The streamer account
 * @param {FirebotAccount} bot - The bot account
 */
function AccountCache(streamer, bot) {
    this.streamer = streamer;
    this.bot = bot;
}

let cache = new AccountCache(
    {
        username: "Streamer",
        loggedIn: false
    },
    {
        username: "Bot",
        loggedIn: false
    }
);

function sendAccoutUpdate() {
    frontendCommunicator.send("accountUpdate", cache);
    accountEvents.emit("account-update", cache);
}

/**
 * Updates a streamer account object with various settings
 * @param {FirebotAccount} streamerAccount
 * @returns {Promise<FirebotAccount>}
 */
async function updateStreamerAccountSettings(streamerAccount) {
    if (streamerAccount == null || streamerAccount.channelId == null) return null;

    const channelAccess = require('../common/channel-access');

    const channelData = await channelAccess.getMixerAccountDetailsById(streamerAccount.channelId);
    streamerAccount.partnered = channelData.partnered;

    try {
        const subBadgeUrl = await channelAccess.getChannelSubBadge(channelData.user.username);
        streamerAccount.subBadge = subBadgeUrl;
    } catch (error) {
        logger.warn("Unable to get sub badge url");
    }

    try {
        const canClip = await channelAccess.getChannelHasClipsEnabled(channelData.id, channelData.user.groups);
        streamerAccount.canClip = canClip;
    } catch (error) {
        logger.warn("Unable to determine if channel can clip");
    }

    return streamerAccount;
}

function saveAccountDataToFile(accountType) {
    let authDb = profileManager.getJsonDbInProfile("/auth");
    let account = cache[accountType];
    try {
        authDb.push(`/${accountType}`, account);
    } catch (error) {
        if (error.name === 'DatabaseError') {
            logger.error(`Error saving ${accountType} account settings`, error);
        }
    }
}

/**
 * Loads account data from file into memory
 * @param {boolean} [emitUpdate=true] - If an account update event should be emitted
 */
async function loadAccountData(emitUpdate = true) {
    let authDb = profileManager.getJsonDbInProfile("/auth");
    try {
        let dbData = authDb.getData("/"),
            streamer = dbData.streamer,
            bot = dbData.bot;

        if (streamer != null && streamer.auth != null) {
            streamer.loggedIn = true;

            const updatedStreamer = await updateStreamerAccountSettings(streamer);
            if (updatedStreamer != null) {
                cache.streamer = updatedStreamer;
                saveAccountDataToFile("streamer");
            } else {
                cache.streamer = streamer;
            }
        }

        if (bot != null && bot.auth != null) {
            bot.loggedIn = true;
            cache.bot = bot;
        }
    } catch (err) {
        logger.warn("Couldnt update auth cache");
    }

    if (emitUpdate) {
        sendAccoutUpdate();
    }
}

let streamerTokenIssue = false;
let botTokenIssue = false;

/**
 * Update and save data for an account
 * @param {string} accountType - The type of account ("streamer" or "bot")
 * @param {FirebotAccount} account - The  account
 */
function updateAccount(accountType, account) {
    if ((accountType !== "streamer" && accountType !== "bot") || account == null) return;

    // reset token issue flags
    if (accountType === 'streamer') {
        streamerTokenIssue = false;
    } else {
        botTokenIssue = false;
    }

    // dont let streamer and bot be the same
    let otherAccount = accountType === "streamer" ? cache.bot : cache.streamer;
    if (otherAccount != null && otherAccount.loggedIn) {
        if (otherAccount.userId === account.userId) {
            renderWindow.webContents.send("error", "You cannot sign into the same user for both Streamer and Bot accounts. The bot account should be a seperate Mixer user. If you don't have a seperate user, simply don't use the Bot account feature as it's not required.");
            return;
        }
    }

    account.loggedIn = true;

    cache[accountType] = account;

    sendAccoutUpdate();

    saveAccountDataToFile(accountType);
}

/**
 * Refreshes a given accounts access token only if necessary
 * @param {string} accountType - The type of account ("streamer" or "bot")
 * @param {boolean} [emitUpdate=false] - If an account update event should be emitted
 */
async function ensureTokenRefreshed(accountType, emitUpdate = false) {
    if (accountType !== "streamer" && accountType !== "bot") return false;

    let account = cache[accountType];
    if (!account.loggedIn) return false;

    let oldToken = account.auth;

    const accountProviderId = accountType === "streamer" ? "mixer:streamer-account" : "mixer:bot-account";
    let updatedToken = await authManager.refreshTokenIfExpired(accountProviderId, account.auth);

    if (updatedToken == null) {
        if (accountType === "streamer") {
            streamerTokenIssue = true;
        } else {
            botTokenIssue = true;
        }
        return false;
    }

    if (updatedToken != null && oldToken.access_token !== updatedToken.access_token) {
        logger.debug("Mixer account token updated, saving.");
        cache[accountType].auth = updatedToken;
        saveAccountDataToFile(accountType);
        if (emitUpdate) {
            sendAccoutUpdate();
        }
        return true;
    }

    return true;
}

function removeAccount(accountType) {
    if (accountType !== "streamer" && accountType !== "bot") return;

    /* Note (ebiggz): Mixer doesnt appear to allow token revoking right now
    let account = cache[accountType];
    if (account.auth) {
        const accountProviderId = accountType === "streamer" ? "mixer:streamer-account" : "mixer:bot-account";
        authManager.revokeTokens(accountProviderId, account.auth);
    }*/

    let authDb = profileManager.getJsonDbInProfile("/auth");
    try {
        authDb.delete(`/${accountType}`);
    } catch (error) {
        if (error.name === 'DatabaseError') {
            logger.error(`Error removing ${accountType} account settings`, error);
        }
    }

    cache[accountType] = {
        username: accountType === "streamer" ? "Streamer" : "Bot",
        loggedIn: false
    };
    sendAccoutUpdate();
}

frontendCommunicator.on("getAccounts", () => {
    logger.debug("got 'get accounts' request");
    return cache;
});

frontendCommunicator.on("logoutAccount", accountType => {
    logger.debug("got 'get accounts' request");
    removeAccount(accountType);
});

exports.events = accountEvents;
exports.updateAccountCache = loadAccountData;
exports.updateAccount = updateAccount;
exports.ensureTokenRefreshed = ensureTokenRefreshed;
exports.updateStreamerAccountSettings = updateStreamerAccountSettings;
exports.getAccounts = () => cache;
exports.streamerTokenIssue = () => streamerTokenIssue;
exports.botTokenIssue = () => botTokenIssue;
