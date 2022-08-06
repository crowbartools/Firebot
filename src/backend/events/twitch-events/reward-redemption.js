"use strict";

const logger = require("../../logwrapper");
const eventManager = require("../EventManager");
const frontendCommunicator = require("../../common/frontend-communicator");

/**@argument {import("@twurple/pubsub").PubSubRedemptionMessage} redemptionMessage */
exports.handleRewardRedemption = (redemptionMessage) => {

    logger.debug("Got reward redemption event!");

    let imageUrl = "";
    if (redemptionMessage && redemptionMessage.defaultImage) {
        const images = redemptionMessage.defaultImage;
        if (images.url_4x) {
            imageUrl = images.url_4x;
        } else if (images.url_2x) {
            imageUrl = images.url_2x;
        } else if (images.url_1x) {
            imageUrl = images.url_1x;
        }
    }

    frontendCommunicator.send("twitch:chat:rewardredemption", {
        id: redemptionMessage.id,
        status: redemptionMessage.status,
        queued: redemptionMessage.rewardIsQueued,
        messageText: redemptionMessage.message,
        user: {
            id: redemptionMessage.userId,
            username: redemptionMessage.userName
        },
        reward: {
            id: redemptionMessage.rewardId,
            name: redemptionMessage.rewardTitle,
            cost: redemptionMessage.rewardCost,
            imageUrl: imageUrl
        }
    });

    setTimeout(() => {

        const redemptionMeta = {
            username: redemptionMessage.userDisplayName,
            messageText: redemptionMessage.message,
            redemptionId: redemptionMessage.id,
            rewardId: redemptionMessage.rewardId,
            rewardImage: imageUrl,
            rewardName: redemptionMessage.rewardTitle,
            rewardDescription: redemptionMessage.rewardPrompt,
            rewardCost: redemptionMessage.rewardCost
        };

        const rewardManager = require("../../channel-rewards/channel-reward-manager");

        rewardManager.triggerChannelReward(redemptionMessage.rewardId, redemptionMeta);

        eventManager.triggerEvent("twitch", "channel-reward-redemption", redemptionMeta);

    }, 100);
};
