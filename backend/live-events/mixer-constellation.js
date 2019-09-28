"use strict";

const { ipcMain } = require("electron");
const Carina = require("carina").Carina;
const ws = require("ws");
const profileManager = require("../common/profile-manager.js");
const eventManager = require("../live-events/EventManager");
const reconnectService = require("../common/reconnect.js");
const connectionManager = require("../common/connection-manager");
const logger = require("../logwrapper");
const patronageManager = require("../patronageManager");
const apiAccess = require("../api-access");
Carina.WebSocket = ws;

// This holds the constellation connection so we can stop it later.
let ca = {};

// This holds the connection status of constellation.
let constellationConnected = false;

// last sub cache
global.lastSub = "";

function setLastSub(username) {
    logger.info(`Setting last sub to: ${username}`);
    global.lastSub = username;
}

// Constellation Connect
// This will connect to constellation and subscribe to all constellation events we need.
function constellationConnect() {
    let dbAuth = profileManager.getJsonDbInProfile("/auth"),
        streamer = dbAuth.getData("/streamer"),
        channelId = streamer.channelId;

    logger.info("Connecting to Constellation.", channelId);
    ca = new Carina({ isBot: true }).open();

    // Clear any previous subscriptions just in case something weird happens.
    ca.subscriptions = {};

    // Channel Status
    // This gets general channel data such as online status, num followers, current viewers.
    let prefix = "channel:" + channelId + ":";
    ca.subscribe(prefix + "update", data => {
        if (data.viewersCurrent != null) {
            renderWindow.webContents.send("currentViewersUpdate", {
                viewersCurrent: data.viewersCurrent
            });
        }

        if (data.online != null) {
            connectionManager.setOnlineStatus(data.online === true);
        }
    });

    // Resub Shared (Cached Event)
    // This is a resub event in which the user manually triggered the celebration.
    ca.subscribe(prefix + "resubShared", data => {
        eventManager.triggerEvent("mixer", "resubscribed", {
            shared: true,
            username: data["user"].username,
            userId: data["user"].id,
            totalMonths: data.totalMonths
        });

        setLastSub(data.user.username);
    });

    // Resub (Cached Event)
    // This is a resub event in which the users payment went through, but they might not be in the channel.
    ca.subscribe(prefix + "resubscribed", data => {
        eventManager.triggerEvent("mixer", "resubscribed", {
            shared: false,
            username: data["user"].username,
            userId: data["user"].id,
            totalMonths: data.totalMonths
        });

        setLastSub(data.user.username);
    });

    // Sub (Cached Event)
    // This is an initial sub to the channel.
    ca.subscribe(prefix + "subscribed", data => {
        eventManager.triggerEvent("mixer", "subscribed", {
            username: data["user"].username,
            userId: data["user"].id,
            totalMonths: 0
        });
        setLastSub(data.user.username);
    });

    // Host (Cached Event)
    // This is a channel host.
    ca.subscribe(prefix + "hosted", data => {
        eventManager.triggerEvent("mixer", "hosted", {
            username: data["hoster"].token
        });
    });

    // Follow (Cached Event)
    // This is a follow event. Filters out unfollows.
    ca.subscribe(prefix + "followed", data => {
    // Filter out the unfollows.
        if (data.following === false) {
            return;
        }

        eventManager.triggerEvent("mixer", "followed", {
            username: data["user"].username,
            userId: data["user"].id
        });
    });

    // Skill
    ca.subscribe(prefix + 'skill', data => {

        logger.debug("Constellation Skill Event");
        logger.debug(data);


        //if gif skill effect, extract url and send to frontend
        if (data && data.manifest) {
            logger.debug("Checking skill for gif...");
            if (data.manifest.name === "giphy") {
                logger.debug("Detected gif effect type");
                if (data.parameters && data.parameters.giphyId) {
                    logger.debug("Gif url is present, building url and sending to FE/triggering event");

                    let giphyHost = data.parameters.giphyHost || "media1.giphy.com",
                        giphyId = data.parameters.giphyId;

                    let gifUrl = `https://${giphyHost}/media/${giphyId}/giphy.gif`;

                    renderWindow.webContents.send('gifUrlForSkill', {
                        executionId: data.executionId,
                        gifUrl: gifUrl
                    });

                    let userId = data.parameters.userId;
                    logger.debug("Getting user data for id '" + userId + "' so we can trigger gif event");

                    // build a skill obj that matches what we get from SkillAttribution event via chat so theres consistency
                    let skill = {
                        "skill_id": 'ba35d561-411a-4b96-ab3c-6e9532a33027',
                        "skill_name": 'A Gif',
                        "execution_id": data.executionId,
                        "icon_url": 'https://static.mixer.com/img/design/ui/skills-chat-attribution/giphy_chat_24.png',
                        cost: data.price,
                        currency: data.currencyType,
                        isGif: true,
                        gifUrl: gifUrl
                    };

                    apiAccess.get(`users/${userId}`)
                        .then(userData => {

                            logger.debug("user data", userData);

                            logger.debug("Got user data, triggering gif event with url: " + gifUrl);

                            return userData.username;
                        }, () => {

                            logger.debug("Failed to get user data, firing event anyway");
                        })
                        .then(username => {
                            eventManager.triggerEvent("mixer", "skill", {
                                username: username ? username : "Unknown User",
                                data: {
                                    skill: skill
                                }
                            });
                        });
                }
            }
        }
    });

    // Patronage updates
    ca.subscribe(prefix + 'patronageUpdate', data => {

        logger.debug("patronageUpdate Event");
        logger.debug(data);

        patronageManager.setChannelPatronageData(data);
    });

    ca.on('error', data => {
        logger.error("error from constellation:", data);

        //attempt to reconnect and reset status
        constellationConnected = false;
        reconnectService.reconnect("Constellation", false, false);
    });

    // Set to connected.
    constellationConnected = true;

    // Set connection status to online
    logger.info("Constellation connected.");
    renderWindow.webContents.send("constellationConnection", "Online");
}

// Constellation Disconnect
// This will disconnect the current constellation connection and unsub from everything.
function constellationDisconnect() {
    logger.info("Disconnecting Constellation.");

    // Close and clear all subscriptions.
    ca.close();
    ca.subscriptions = {};

    // Set to not connected.
    constellationConnected = false;

    // Set connection status to online
    renderWindow.webContents.send("constellationConnection", "Offline");
}

// Constellation Status
// This will return if we're connected to constellation or not.
function getConstellationStatus() {
    return constellationConnected;
}

// Constellation Toggle
// Controls Turning on and off constellation when connection button is pressed.
ipcMain.on("mixerConstellation", function(event, status) {
    if (status === "connect" || status === "connected") {
        constellationConnect();
    } else {
    // Kill connection.
        constellationDisconnect();
    }
});

// Auth Process
// This kicks off the login process once refresh tokens are recieved.
ipcMain.on("gotConstellationRefreshToken", function() {
    constellationConnect();
});

// Export Functions
exports.connect = constellationConnect;
exports.disconnect = constellationDisconnect;
exports.getConstellationStatus = getConstellationStatus;
