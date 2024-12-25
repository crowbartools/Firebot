"use strict";

const accountAccess = require('../common/account-access');
const cloudSync = require("./cloud-sync");
const logger = require("../logwrapper");
const commandList = require("./sync-handlers/command-list");
const quoteList = require("./sync-handlers/quotes-list");
const frontendCommunicator = require("../common/frontend-communicator");
const { SettingsManager } = require("../common/settings-manager");
const rankManager = require("../ranks/rank-manager");

async function syncProfileData(profileSyncData) {
    const streamerUsername = accountAccess.getAccounts().streamer.username;
    const commands = await commandList.getCommandListForSync(profileSyncData.username, profileSyncData.userRoles);
    const quotes = await quoteList.getQuoteListForSync();

    const variableManager = require("../variables/replace-variable-manager");

    const completeSyncJSON = {
        'owner': streamerUsername,
        'chatter': profileSyncData.username,
        'profilePage': profileSyncData.profilePage,
        'commands': commands,
        'sortTags': await frontendCommunicator.fireEventAsync("get-sort-tags", "commands"),
        'variables': variableManager.getReplaceVariables().map(v => v.definition),
        'ranks': rankManager.getAllItems(),
        'quotes': quotes,
        'allowQuoteCSVDownloads': SettingsManager.getSetting("AllowQuoteCSVDownloads")
    };

    const binId = await cloudSync.sync(completeSyncJSON);

    if (binId != null) {
        return binId;
    }

    logger.error('Cloud Sync: Unable to get binId from bytebin for profile data.');
    return null;
}

exports.syncProfileData = syncProfileData;