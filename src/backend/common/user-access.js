"use strict";

const NodeCache = require('node-cache');

const { TwitchApi } = require("../streaming-platforms/twitch/api");

const followCache = new NodeCache({ stdTTL: 10, checkperiod: 10 });

async function userFollowsChannels(username, channelNames, durationInSeconds = 0) {
    let userfollowsAllChannels = true;

    for (const channelName of channelNames) {
        /**
         * @type {import('@twurple/api').HelixChannelFollower | boolean}
         */
        let userFollow;

        // check cache first
        const cachedFollow = followCache.get(`${username}:${channelName}`);
        if (cachedFollow !== undefined) {
            userFollow = cachedFollow;
        } else {
            userFollow = await TwitchApi.users.getUserChannelFollow(username, channelName);

            // set cache value
            followCache.set(`${username}:${channelName}`, userFollow);
        }

        if (!userFollow) {
            userfollowsAllChannels = false;
            break;
        }

        if (userFollow === true) { // streamer follow
            continue;
        }

        if (durationInSeconds > 0) {
            const followTime = Math.round(userFollow.followDate.getTime() / 1000);
            const currentTime = Math.round(new Date().getTime() / 1000);
            if ((currentTime - followTime) < durationInSeconds) {
                userfollowsAllChannels = false;
                break;
            }
        }
    }

    return userfollowsAllChannels;
}

exports.userFollowsChannels = userFollowsChannels;