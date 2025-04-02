"use strict";

const profileManager = require("./profile-manager");
const logger = require("../logwrapper");
const frontendCommunicator = require("./frontend-communicator");
const EventEmitter = require("events");

/**@type {NodeJS.EventEmitter} */
const accountEvents = new EventEmitter();

/**
 * A streamer or bot account
 * @typedef {Object} FirebotAccount
 * @property {string} username - The account username
 * @property {string} displayName - The users displayName
 * @property {string} description - The users description
 * @property {string} userId - The user id for the account
 * @property {number} channelId - DEPRECATED: The channel id for the account (same as userId)
 * @property {string} avatar - The avatar url for the account
 * @property {string} broadcasterType - "partner", "affiliate" or ""
 * @property {import("../auth/auth").AuthDetails} auth - Auth token details for the account
 * @property {boolean=} loggedIn - If the account is linked/logged in
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

const cache = new AccountCache(
    {
        username: "Streamer",
        loggedIn: false
    },
    {
        username: "Bot",
        loggedIn: false
    }
);

function sendAccountUpdate() {
    frontendCommunicator.send("accountUpdate", cache);
    accountEvents.emit("account-update", cache);
}

/**
 * Updates a streamer account object with various settings
 * @param {FirebotAccount} streamerAccount
 * @returns {Promise<FirebotAccount>}
 */
async function updateStreamerAccountSettings(streamerAccount) {
    if (streamerAccount == null || streamerAccount.channelId == null) {
        return null;
    }

    return streamerAccount;
}

function saveAccountDataToFile(accountType) {
    const authDb = profileManager.getJsonDbInProfile("/auth-twitch");
    const account = cache[accountType];
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
    const authDb = profileManager.getJsonDbInProfile("/auth-twitch");
    try {
        const dbData = authDb.getData("/"),
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
        logger.warn("Couldn't update auth cache");
    }

    if (emitUpdate) {
        sendAccountUpdate();
    }
}

const getTwitchData = async (accountType) => {
    const twitchApi = require("../twitch-api/api");
    const chatHelpers = require("../chat/chat-helpers");

    const account = accountType === "streamer" ? cache.streamer : cache.bot;

    let data;
    try {
        data = await twitchApi.users.getUserById(account.userId);
    } catch (error) {
        logger.warn("[accounts.getTwitchData] Failed to get account data:", error.message);
        return account;
    }

    account.avatar = data.profilePictureUrl;
    chatHelpers.setUserProfilePicUrl(account.userId, data.profilePictureUrl, false);

    if (accountType === "streamer") {
        account.broadcasterType = data.broadcasterType;
    }

    account.username = data.name;
    account.displayName = data.displayName;

    return account;
};

const refreshTwitchData = async () => {
    if (cache.streamer && cache.streamer.loggedIn) {
        cache.streamer = await getTwitchData("streamer");
        saveAccountDataToFile("streamer");
    }

    if (cache.bot && cache.bot.loggedIn) {
        cache.bot = await getTwitchData("bot");
        saveAccountDataToFile("bot");
    }
};

let streamerTokenIssue = false;
let botTokenIssue = false;

/**
 * Update and save data for an account
 * @param {string} accountType - The type of account ("streamer" or "bot")
 * @param {FirebotAccount} account - The  account
 */
function updateAccount(accountType, account, emitUpdate = true) {
    if ((accountType !== "streamer" && accountType !== "bot") || account == null) {
        return;
    }

    // reset token issue flags
    if (accountType === 'streamer') {
        streamerTokenIssue = false;
    } else {
        botTokenIssue = false;
    }

    // don't let streamer and bot be the same
    const otherAccount = accountType === "streamer" ? cache.bot : cache.streamer;
    if (otherAccount != null && otherAccount.loggedIn) {
        if (otherAccount.userId === account.userId) {
            frontendCommunicator.send("error", "You cannot sign into the same user for both Streamer and Bot accounts. The bot account should be a separate Twitch user. If you don't have a separate user, simply don't use the Bot account feature as it is not required.");
            return;
        }
    }

    account.loggedIn = true;

    cache[accountType] = account;

    saveAccountDataToFile(accountType);

    if (emitUpdate) {
        sendAccountUpdate();
    }
}

function removeAccount(accountType) {
    if (accountType !== "streamer" && accountType !== "bot") {
        return;
    }

    const authDb = profileManager.getJsonDbInProfile("/auth-twitch");
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
    sendAccountUpdate();
}

frontendCommunicator.on("getAccounts", () => {
    logger.debug("got 'get accounts' request");
    return cache;
});

frontendCommunicator.on("logoutAccount", (accountType) => {
    logger.debug("got logout request for", accountType);
    removeAccount(accountType);
});

function setAccountTokenIssue(accountType) {
    if (accountType === "streamer") {
        streamerTokenIssue = true;
    } else if (accountType === "bot") {
        botTokenIssue = true;
    } else {
        throw new Error("invalid account type");
    }

    frontendCommunicator.send("invalidate-accounts", {
        streamer: streamerTokenIssue,
        bot: botTokenIssue
    });
}

exports.events = accountEvents;
exports.updateAccountCache = loadAccountData;
exports.updateAccount = updateAccount;
exports.updateStreamerAccountSettings = updateStreamerAccountSettings;
exports.getAccounts = () => cache;
exports.setAccountTokenIssue = setAccountTokenIssue;
exports.streamerTokenIssue = () => streamerTokenIssue;
exports.botTokenIssue = () => botTokenIssue;
exports.refreshTwitchData = refreshTwitchData;