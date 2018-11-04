"use strict";
const {ipcMain} = require("electron");
const logger = require("./logwrapper");

const request = require("request");
const accountAccess = require("./common/account-access");

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
    let channelId = 40812;

    let url = `v2/levels/patronage/channels/${channelId}/status`;

    return requestAsStreamer('GET', url);
}

function fetchPatronagePeriodData(periodId) {
    let url = `v2/levels/patronage/resources/${periodId}`;

    return requestAsStreamer('GET', url);
}

async function loadPatronageData() {
    let channelData = await fetchChannelPatronageData();

    channelPatronageData = channelData;

    let periodData = await fetchPatronagePeriodData(channelData.patronagePeriodId);

    patronagePeriodData = periodData;
}

function setChannelPatronageData(channelData) {
    channelPatronageData = channelData;
    renderWindow.webContents.send("channelPatronageUpdate", channelData);
}

ipcMain.on("getPatronageData", event => {
    logger.info("got 'getPatronageData' request");
    event.returnValue = { channel: channelPatronageData, period: patronagePeriodData };
});


exports.setChannelPatronageData = setChannelPatronageData;
exports.loadPatronageData = loadPatronageData;
