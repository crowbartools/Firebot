'use strict';

const {ipcMain} = require('electron');
const Carina = require('carina').Carina;
const ws = require('ws');
const dataAccess = require('../common/data-access.js');
const eventsRouter = require('../live-events/events-router.js');
const { LiveEvent, EventSourceType, EventType } = require('./EventType');
const reconnectService = require('../common/reconnect.js');
const logger = require('../logwrapper');
Carina.WebSocket = ws;

// This holds the constellation connection so we can stop it later.
let ca = {};

// This holds the connection status of constellation.
let constellationConnected = false;

// last sub cache
let lastSub = "";

function setLastSub(username) {
    logger.info(`Setting last sub to: ${username}`);
    lastSub = username;
}

// Constellation Connect
// This will connect to constellation and subscribe to all constellation events we need.
function constellationConnect() {
    let dbAuth = dataAccess.getJsonDbInUserData("/user-settings/auth"),
        streamer = dbAuth.getData('/streamer'),
        channelId = streamer.channelId;

    logger.info('Connecting to Constellation.', channelId);
    ca = new Carina({ isBot: true }).open();

    // Clear any previous subscriptions just in case something weird happens.
    ca.subscriptions = {};

    // Channel Status
    // This gets general channel data such as online status, num followers, current viewers.
    let prefix = 'channel:' + channelId + ":";
    ca.subscribe(prefix + 'update', data => {
        if (data.viewersCurrent != null) {
            renderWindow.webContents.send('currentViewersUpdate', { viewersCurrent: data.viewersCurrent });
        }
    });

    // Resub Shared (Cached Event)
    // This is a resub event in which the user manually triggered the celebration.
    ca.subscribe(prefix + 'resubShared', data => {
        let event = new LiveEvent(EventType.SUBSCRIBED, EventSourceType.CONSTELLATION, {
            shared: true,
            username: data['user'].username,
            totalMonths: data.totalMonths
        });

        setLastSub(data['user'].username);

        eventsRouter.cachedEvent(event);
    });

    // Resub (Cached Event)
    // This is a resub event in which the users payment went through, but they might not be in the channel.
    ca.subscribe(prefix + 'resubscribed', data => {
        let event = new LiveEvent(EventType.SUBSCRIBED, EventSourceType.CONSTELLATION, {
            shared: false,
            username: data['user'].username,
            totalMonths: data.totalMonths
        });

        setLastSub(data['user'].username);

        eventsRouter.cachedEvent(event);
    });

    // Sub (Cached Event)
    // This is an initial sub to the channel.
    ca.subscribe(prefix + 'subscribed', data => {
        let event = new LiveEvent(EventType.SUBSCRIBED, EventSourceType.CONSTELLATION, {
            username: data['user'].username,
            totalMonths: 0
        });

        setLastSub(data['user'].username);

        eventsRouter.cachedEvent(event);
    });

    // Host (Cached Event)
    // This is a channel host.
    ca.subscribe(prefix + 'hosted', data => {
        let event = new LiveEvent(EventType.HOSTED, EventSourceType.CONSTELLATION, {
            username: data['hoster'].token
        });

        eventsRouter.cachedEvent(event);
    });

    // Follow (Cached Event)
    // This is a follow event. Filters out unfollows.
    ca.subscribe(prefix + 'followed', data => {
        // Filter out the unfollows.
        if (data.following === false) {
            return;
        }

        let event = new LiveEvent(EventType.FOLLOWED, EventSourceType.CONSTELLATION, {
            username: data['user'].username
        });

        eventsRouter.cachedEvent(event);
    });

    ca.on('error', data => {
        logger.error("error from constellation:", data);

        //attempt to reconnect and reset status
        constellationConnected = false;
        reconnectService.reconnect('Constellation', false, false);
    });

    // Set to connected.
    constellationConnected = true;

    // Set connection status to online
    logger.info('Constellation connected.');
    renderWindow.webContents.send('constellationConnection', "Online");
}

// Constellation Disconnect
// This will disconnect the current constellation connection and unsub from everything.
function constellationDisconnect() {
    logger.info('Disconnecting Constellation.');

    // Close and clear all subscriptions.
    ca.close();
    ca.subscriptions = {};

    // Set to not connected.
    constellationConnected = false;

    // Set connection status to online
    renderWindow.webContents.send('constellationConnection', "Offline");
}

// Constellation Status
// This will return if we're connected to constellation or not.
function getConstellationStatus() {
    return constellationConnected;
}

// Constellation Toggle
// Controls Turning on and off constellation when connection button is pressed.
ipcMain.on('mixerConstellation', function(event, status) {
    if (status === "connect" || status === "connected") {
        constellationConnect();
    } else {
        // Kill connection.
        constellationDisconnect();
    }
});

// Auth Process
// This kicks off the login process once refresh tokens are recieved.
ipcMain.on('gotConstellationRefreshToken', function() {
    constellationConnect();
});

// Export Functions
exports.connect = constellationConnect;
exports.disconnect = constellationDisconnect;
exports.getConstellationStatus = getConstellationStatus;
exports.getLastSub = () => lastSub;