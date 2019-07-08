"use strict";
const EventEmitter = require("events");
const channelAccess = require("./channel-access");

let isOnline = false;
let onlineCheckIntervalId;

/**
 * @type ConnectionManager
 */
let manager;

function updateOnlineStatus(online) {
    if (online !== isOnline) {
        isOnline = online === true;
    }
    manager.emit("streamerOnlineChange", isOnline);
}

async function checkOnline() {
    let isOnline = await channelAccess.getStreamerOnlineStatus();
    updateOnlineStatus(isOnline);
}

class ConnectionManager extends EventEmitter {
    constructor() {
        super();
    }

    startOnlineCheckInterval() {
        if (onlineCheckIntervalId != null) {
            clearInterval(onlineCheckIntervalId);
        }
        checkOnline();
        onlineCheckIntervalId = setInterval(checkOnline, 10000);
    }

    setOnlineStatus(online) {
        updateOnlineStatus(online);
    }

    streamerIsOnline() {
        return isOnline;
    }
}

manager = new ConnectionManager();

module.exports = manager;
