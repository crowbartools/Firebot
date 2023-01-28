"use strict";

const accountAccess = require("../common/account-access");

const twitchApi = require("./api");

const twitchEventsHandler = require("../events/twitch-events");

let followPollIntervalId;
let lastUserId;
let pollStartTime;

function clearPollInterval() {
    if (followPollIntervalId != null) {
        clearTimeout(followPollIntervalId);
    }
}

exports.startFollowPoll = () => {
    clearPollInterval();
    pollStartTime = Date.now();
    followPollIntervalId = setInterval(async () => {
        const streamer = accountAccess.getAccounts().streamer;
        const client = twitchApi.getClient();

        if (client == null || !streamer.loggedIn) {
            return;
        }

        const followRequest = client.users.getFollowsPaginated({
            followedUser: streamer.userId
        });

        const follows = await followRequest.getNext();

        if (follows == null || follows.length < 1) {
            return;
        }

        if (lastUserId == null) {
            lastUserId = follows[0].userId;
        } else {
            for (const follow of follows) {

                if (follow.followDate < pollStartTime) {
                    break;
                }

                if (follow.userId !== lastUserId) {
                    twitchEventsHandler.follow.triggerFollow(
                        follow.userId,
                        follow.userName,
                        follow.userDisplayName
                    );
                } else {
                    break;
                }

            }
            lastUserId = follows[0].userId;
        }
    }, 10000);
};

exports.stopFollowPoll = () => {
    clearPollInterval();
};