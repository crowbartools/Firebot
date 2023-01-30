"use strict";

const accountAccess = require("../common/account-access");
const twitchApi = require("./api").default;
const frontendCommunicator = require("../common/frontend-communicator");


const streamInfo = {
    isLive: false,
    viewers: 0,
    startedAt: null
};

// every 15 secs
const POLL_INTERVAL = 15000;

let streamInfoPollIntervalId;

function clearPollInterval() {
    if (streamInfoPollIntervalId != null) {
        clearTimeout(streamInfoPollIntervalId);
    }
}

async function handleStreamInfo() {
    const streamer = accountAccess.getAccounts().streamer;
    const client = twitchApi.getClient();

    if (client == null || !streamer.loggedIn) {
        return;
    }

    const logger = require("../logwrapper");

    const stream = await client.streams.getStreamByUserId(streamer.userId);

    let streamInfoChanged = false;
    if (stream == null) {
        if (streamInfo.isLive) {
            streamInfoChanged = true;
        }
        streamInfo.isLive = false;
    } else {
        if (!streamInfo.isLive ||
            streamInfo.viewers !== stream.viewers ||
            streamInfo.startedAt !== stream.startDate.toISOString()) {
            streamInfoChanged = true;
        }
        streamInfo.isLive = true;
        streamInfo.viewers = stream.viewers;
        streamInfo.startedAt = stream.startDate.toISOString();
    }
    if (streamInfoChanged) {
        logger.debug(`Sending stream info update`);
        frontendCommunicator.send("stream-info-update", streamInfo);
    }
}

frontendCommunicator.onAsync("get-stream-info", async () => {
    return streamInfo;
});

exports.startStreamInfoPoll = () => {
    clearPollInterval();
    handleStreamInfo();
    streamInfoPollIntervalId = setInterval(handleStreamInfo, POLL_INTERVAL);
};

exports.stopStreamInfoPoll = () => {
    clearPollInterval();
};