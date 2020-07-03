"use strict";

const accountAccess = require("../common/account-access");

const twitchApi = require("./client");

const followEvent = require("../events/twitch-events/follow");

let followPollIntervalId;
let lastPoll;

function clearPollInterval() {
    if (followPollIntervalId != null) {
        clearTimeout(followPollIntervalId);
    }
}

exports.startFollowPoll = () => {
    clearPollInterval();
    lastPoll = new Date();
    followPollIntervalId = setInterval(async () => {
        const streamer = accountAccess.getAccounts().streamer;
        const client = twitchApi.getClient();

        if (client == null || !streamer.loggedIn) return;

        const followRequest = client.helix.users.getFollowsPaginated({
            followedUser: streamer.userId
        });

        const follows = await followRequest.getNext();

        for (const follow of follows) {
            if (follow.followDate > lastPoll) {
                followEvent.triggerFollow(follow.userDisplayName, follow.userId);
            } else {
                break;
            }
        }
        lastPoll = new Date();
    }, 10000);
};

exports.stopFollowPoll = () => {
    clearPollInterval();
};