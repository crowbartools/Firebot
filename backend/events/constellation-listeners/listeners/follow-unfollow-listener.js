"use strict";

const { settings } = require("../../../common/settings-access");
const eventManager = require("../../../events/EventManager");

const followTimeouts = {};

function cancelPreviousFollowTimeout(followUser) {
    if (!followUser) return;
    if (followTimeouts[followUser.id]) {
        clearTimeout(followTimeouts[followUser.id]);
        followTimeouts[followUser.id] = null;
    }
}

module.exports = {
    event: "channel:{streamerChannelId}:followed",
    callback: (data) => {
        if (data == null || data.user == null) return;

        let { user, following } = data;

        cancelPreviousFollowTimeout(user);

        // stop processing if it was an unfollow
        if (!following) {
            return;
        }

        if (settings.getGuardAgainstUnfollowUnhost()) {
            followTimeouts[user.id] = setTimeout(followUser => {
                eventManager.triggerEvent("mixer", "followed", {
                    username: followUser.username,
                    userId: followUser.id
                });
                cancelPreviousFollowTimeout(user);
            }, 2500, user);
        } else {
            eventManager.triggerEvent("mixer", "followed", {
                username: user.username,
                userId: user.id
            });
        }
    }
};