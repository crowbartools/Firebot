'use strict';

const dataAccess = require('./data-access');
const logger = require('../logwrapper');

function AccountCache(streamer, bot) {
    this.streamer = streamer;
    this.bot = bot;
}

let cache = new AccountCache(
    {
        username: "Unknown Streamer",
        loggedIn: false
    },
    {
        username: "Unknown bot",
        loggedIn: false
    }
);

// Update auth cache
function updateAccountCache() {
    let authDb = dataAccess.getJsonDbInUserData('/user-settings/auth');

    try {
        let dbData = authDb.getData('/'),
            streamer = dbData.streamer,
            bot = dbData.bot;

        if (streamer != null) {
            streamer.loggedIn = true;
            cache.streamer = streamer;
        }

        if (bot != null) {
            bot.loggedIn = true;
            cache.bot = bot;
        }
    } catch (err) {
        logger.warn('Couldnt update auth cache');
    }
}

updateAccountCache();

exports.updateAccountCache = updateAccountCache;
exports.getAccounts = () => cache;