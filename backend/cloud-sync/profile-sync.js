"use strict";

const accountAccess = require('../common/account-access');
const cloudSync = require("./cloud-sync");
const logger = require("../logwrapper");
const commandList = require("./sync-handlers/command-list");
const quoteList = require("./sync-handlers/quotes-list");

async function syncProfileData(profileSyncData) {
    let streamerUsername = accountAccess.getAccounts().streamer.username;
    let commands = await commandList.getCommandListForSync(profileSyncData.username, profileSyncData.userRoles);
    let quotes = await quoteList.getQuoteListForSync();

    let completeSyncJSON = {
        'owner': streamerUsername,
        'chatter': profileSyncData.username,
        'profilePage': profileSyncData.profilePage,
        'commands': commands,
        'quotes': quotes
    };

    let binId = await cloudSync.sync(completeSyncJSON);

    if (binId !== false) {
        return binId;
    }

    logger.error('Cloud Sync: Unable to get binId from bytebin for quotes list.');
    return null;
}

exports.syncProfileData = syncProfileData;