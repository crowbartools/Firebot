"use strict";

const { ipcMain } = require("electron");
const profileManager = require("./profile-manager");
const logger = require("../logwrapper");

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
    let authDb = profileManager.getJsonDbInProfile("/auth");

    try {
        let dbData = authDb.getData("/"),
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
        logger.warn("Couldnt update auth cache");
    }
}

updateAccountCache();

ipcMain.on("getAccounts", event => {
    logger.debug("got 'get accounts' request");
    event.returnValue = cache;
});

exports.updateAccountCache = updateAccountCache;
exports.getAccounts = () => cache;
