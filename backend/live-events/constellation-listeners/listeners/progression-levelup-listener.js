"use strict";

const logger = require("../../../logwrapper");
const apiAccess = require("../../../api-access");
const eventManager = require("../../EventManager");

module.exports = {
    event: "progression:{streamerChannelId}:levelup",
    callback: async (data) => {
        if (data == null || data.userId == null || data.level == null) return;

        let userData;
        try {
            userData = await apiAccess.get(`users/${data.userId}`);
        } catch (err) {
            logger.warn("Failed to get user data in progression level up event", err);
            return;
        }
        let username = userData.username;

        eventManager.triggerEvent("mixer", "progression-levelup", {
            username: username,
            rankBadgeUrl: data.level.assetsUrl.replace("{variant}", "large.gif"),
            userLevel: data.level.level,
            userTotalHearts: data.level.currentXp,
            userNextLevelXp: data.level.nextLevelXp
        });
    }
};