"use strict";
const {ipcMain} = require("electron");
const logger = require("./logwrapper");

const request = require("request");
const accountAccess = require("./common/account-access");

const eventManager = require("./events/EventManager");

const CLIENT_ID = 'f78304ba46861ddc7a8c1fb3706e997c3945ef275d7618a9';

let firstLoad = true;

function requestAsStreamer(method, route, body) {
    return new Promise((resolve, reject) => {
        let streamerData = accountAccess.getAccounts().streamer;

        let options = {
            url: `https://mixer.com/api/${route}`,
            method: method,
            headers: {
                'User-Agent': 'Firebot v5',
                'Client-ID': CLIENT_ID
            },
            json: true,
            body: body
        };

        if (streamerData.loggedIn) {
            options.headers['Authorization'] = `Bearer ${streamerData.auth.access_token}`;
        }

        request(options, function(err, res) {
            if (!err && res.statusCode === 200) {
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

    let streamerChannelId = accountAccess.getAccounts().streamer.channelId;
    let url = `v2/levels/patronage/channels/${streamerChannelId}/status`;

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

        // create timer to reload timer when period ends
        if (firstLoad && patronagePeriodData) {
            firstLoad = false;

            let now = new Date();
            let reset = new Date(patronagePeriodData.endTime);

            //Note(ebiggz): get the diff and give mixer a second to update not sure how quick the switch over is.
            const duration = (reset.getTime() - now.getTime()) + 1000;

            logger.info(`Setting period timer for ${duration / 1000} seconds`);
            setTimeout(async () => {
                await loadPatronageData();
                renderWindow.webContents.send("periodPatronageUpdate", patronagePeriodData);
                renderWindow.webContents.send("channelPatronageUpdate", channelPatronageData);
            }, duration);
        }
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

        logger.debug("Got new patronage data.");
        // are we in the same period?
        if (newPatronageData.patronagePeriodId === previousPatronageData.patronagePeriodId) {
            // are we in a new milestone group or new milestone?
            if (newPatronageData.currentMilestoneGroupId > previousPatronageData.currentMilestoneGroupId ||
                newPatronageData.currentMilestoneId > previousPatronageData.currentMilestoneId) {

                logger.info("It appears we reached a new spark patronage milestone. Yay! Firing event.");

                let streamerName = accountAccess.getAccounts().streamer.username;
                eventManager.triggerEvent("mixer", "patronage-milestone", {
                    username: streamerName,
                    previousPatronageData: previousPatronageData,
                    newPatronageData: newPatronageData
                });
            }
        } else {
            //we are in a new period, get new period data
            fetchPatronagePeriodData(newPatronageData.patronagePeriodId).then(peroidData => {
                patronagePeriodData = peroidData;
                renderWindow.webContents.send("periodPatronageUpdate", peroidData);
            });
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
exports.getCurrentMilestoneGroup = () => {
    if (patronagePeriodData == null || channelPatronageData == null) return null;
    return patronagePeriodData.milestoneGroups.find(mg => mg.id === channelPatronageData.currentMilestoneGroupId);
};

exports.getCurrentMilestone = () => {
    if (patronagePeriodData == null || channelPatronageData == null) return null;

    let milestoneGroup = exports.getCurrentMilestoneGroup();

    if (milestoneGroup == null) return null;

    return milestoneGroup.find(m => m.id === channelPatronageData.currentMilestoneId);
};

exports.getPreviousMilestone = () => {
    if (patronagePeriodData == null || channelPatronageData == null) return null;

    let currentMilestoneGroup = exports.getCurrentMilestoneGroup(),
        currentMilestone = exports.getCurrentMilestone();

    if (currentMilestoneGroup == null || currentMilestone == null) return null;

    let previousMilestone;
    // if current milestone is first on milestone group, we will need to get previous milestone
    if (currentMilestone.id === currentMilestoneGroup.milestones[0].id) {
        let prevMilestoneGroup = patronagePeriodData.milestoneGroups
            .find(mg => mg.id === channelPatronageData.currentMilestoneGroupId - 1);

        if (prevMilestoneGroup) {
            //get last milestone
            previousMilestone = prevMilestoneGroup.milestones[prevMilestoneGroup.milestones.length - 1];
        }
    } else {
        //get previous milestone from current group
        previousMilestone = currentMilestoneGroup.milestones
            .find(m => m.id === channelPatronageData.currentMilestoneId - 1);
    }
    return previousMilestone;
};
