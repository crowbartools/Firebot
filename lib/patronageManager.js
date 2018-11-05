"use strict";
const {ipcMain} = require("electron");
const logger = require("./logwrapper");

const request = require("request");
const accountAccess = require("./common/account-access");

const { LiveEvent, EventType, EventSourceType } = require('./live-events/EventType');
const eventRouter = require('./live-events/events-router');

const CLIENT_ID = 'f78304ba46861ddc7a8c1fb3706e997c3945ef275d7618a9';

function requestAsStreamer(method, route, body) {
    return new Promise((resolve, reject) => {
        let streamerData = accountAccess.getAccounts().streamer;

        let options = {
            url: `https://mixer.com/api/${route}`,
            method: method,
            headers: {
                'User-Agent': 'Firebot',
                'Authorization': `Bearer ${streamerData.accessToken}`,
                'Client-ID': CLIENT_ID
            },
            json: true,
            body: body
        };

        request(options, function(err, res) {
            if (res.statusCode === 200) {
                resolve(res.body);
            } else {
                reject(err);
            }
        });
    });
}

let channelPatronageData = null;
let patronagePeriodData = null;

function fetchChannelPatronageData() {

    let streamer = accountAccess.getAccounts().streamer;

    let url = `v2/levels/patronage/channels/${streamer.channelId}/status`;

    return requestAsStreamer('GET', url);
}

function fetchPatronagePeriodData(periodId) {
    let url = `v2/levels/patronage/resources/${periodId}`;

    return requestAsStreamer('GET', url);
}

async function loadPatronageData() {
    let streamer = accountAccess.getAccounts().streamer;
    if (streamer.loggedIn) {
        let channelData = await fetchChannelPatronageData();

        channelPatronageData = channelData;

        let periodData = await fetchPatronagePeriodData(channelData.patronagePeriodId);

        patronagePeriodData = periodData;
    }
}

function setChannelPatronageData(channelData) {
    if (channelData == null) return;

    // we have previous data, check if we passed a milestone
    if (channelPatronageData != null) {

        let previousPatronageData = JSON.parse(JSON.stringify(channelPatronageData));
        let newPatronageData = JSON.parse(JSON.stringify(channelData));

        // update our state
        // we do this now because we want to make sure its set before the event fires
        // for replace variable purposes
        channelPatronageData = channelData;

        // are we in the same period?
        if (newPatronageData.patronagePeriodId === previousPatronageData.patronagePeriodId) {
            // are we in a new milestone group or new milestone?
            if (newPatronageData.currentMilestoneGroupId > previousPatronageData.currentMilestoneGroupId ||
                newPatronageData.currentMilestoneId > previousPatronageData.currentMilestoneId) {

                // fire firebot event
                let streamerName = accountAccess.getAccounts().streamer.username;
                let event = new LiveEvent(EventType.PATRONAGE_MILESTONE_COMPLETED, EventSourceType.CONSTELLATION, {
                    username: streamerName,
                    previousPatronageData: previousPatronageData
                });

                eventRouter.uncachedEvent(event);
            }
        }
    } else {
        // update state
        channelPatronageData = channelData;
    }

    renderWindow.webContents.send("channelPatronageUpdate", channelData);
}

ipcMain.on("getPatronageData", event => {
    logger.info("got 'getPatronageData' request");
    event.returnValue = { channel: channelPatronageData, period: patronagePeriodData };
});


exports.setChannelPatronageData = setChannelPatronageData;
exports.loadPatronageData = loadPatronageData;
exports.getPatronageData = () => {
    return { channel: channelPatronageData, period: patronagePeriodData };
};
