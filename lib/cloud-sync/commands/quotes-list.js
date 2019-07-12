"use strict";
const accountAccess = require('../../common/account-access');
const quoteManager = require("../../quotes/quotes-manager");
const cloudSync = require("../../cloud-sync/cloud-sync");
const logger = require("../../logwrapper");

async function getQuoteListSyncId(username) {
    let quotes = await quoteManager.getAllQuotes();
    let streamerUsername = accountAccess.getAccounts().streamer.username;
    let quotesData = {
        'owner': streamerUsername,
        'chatter': username,
        'quotes': quotes
    };

    if (quotesData.quotes == null) {
        return null;
    }

    let binId = await cloudSync.sync(quotesData);

    if (binId !== false) {
        return binId;
    }

    logger.error('Cloud Sync: Unable to get binId from bytebin for quotes list.');
    return null;
}

exports.getQuoteListSyncId = getQuoteListSyncId;