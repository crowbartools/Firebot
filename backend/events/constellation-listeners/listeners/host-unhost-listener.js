"use strict";

const { settings } = require("../../../common/settings-access");
const eventManager = require("../../../events/EventManager");

const hostTimeouts = {};

function cancelPreviousHostTimeout(userId) {
    if (!userId) return;
    if (hostTimeouts[userId]) {
        clearTimeout(hostTimeouts[userId]);
        hostTimeouts[userId] = null;
    }
}

exports.hostListener = {
    event: "channel:{streamerChannelId}:hosted",
    callback: (data) => {
        if (data == null) return;
        let { hoster, hosterId, auto } = data;

        cancelPreviousHostTimeout(hosterId);

        if (settings.getGuardAgainstUnfollowUnhost()) {
            hostTimeouts[hosterId] = setTimeout((hostUser, hostUserId, isAuto) => {
                eventManager.triggerEvent("mixer", "hosted", {
                    username: hostUser.token,
                    viewerCount: hostUser.viewersCurrent || 0,
                    auto: isAuto
                });
                cancelPreviousHostTimeout(hostUserId);
            }, 2500, hoster, hosterId, auto);
        } else {
            eventManager.triggerEvent("mixer", "hosted", {
                username: hoster.token,
                viewerCount: hoster.viewersCurrent || 0,
                auto: auto
            });
        }
    }
};

exports.unhostListener = {
    event: "channel:{streamerChannelId}:unhosted",
    callback: (data) => {
        if (data == null) return;

        let { hosterId } = data;

        if (settings.getGuardAgainstUnfollowUnhost()) {
            cancelPreviousHostTimeout(hosterId);
        }
    }
};