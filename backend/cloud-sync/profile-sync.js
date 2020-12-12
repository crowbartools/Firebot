"use strict";

const accountAccess = require('../common/account-access');
const cloudSync = require("./cloud-sync");
const logger = require("../logwrapper");
const commandList = require("./sync-handlers/command-list");
const quoteList = require("./sync-handlers/quotes-list");
const { settings } = require("../common/settings-access");

async function syncProfileData(profileSyncData) {
    let streamerUsername = accountAccess.getAccounts().streamer.username;
    let commands = await commandList.getCommandListForSync(profileSyncData.username, profileSyncData.userRoles);
    let quotes = await quoteList.getQuoteListForSync();

    let completeSyncJSON = {
        'owner': streamerUsername,
        'chatter': profileSyncData.username,
        'profilePage': profileSyncData.profilePage,
        'commands': commands,
        'quotes': quotes,
        'allowQuoteCSVDownloads': settings.getAllowQuoteCSVDownloads()
    };

    let binId = await cloudSync.sync(completeSyncJSON);

    if (binId != null) {
        return binId;
    }

    logger.error('Cloud Sync: Unable to get binId from bytebin for quotes list.');
    return null;
}

exports.syncProfileData = syncProfileData;