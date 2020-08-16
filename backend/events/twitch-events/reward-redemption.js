"use strict";

const logger = require("../../logwrapper");
const eventManager = require("../EventManager");
const frontendCommunicator = require("../../common/frontend-communicator");

/**@argument {import('twitch-pubsub-client').PubSubRedemptionMessage} redemptionMessage */
exports.handleRewardRedemption = (redemptionMessage) => {

    logger.debug("Got reward redemption event!");

    let imageUrl;
    if (redemptionMessage._data &&
        redemptionMessage._data.data &&
        redemptionMessage._data.data.redemption &&
        redemptionMessage._data.data.redemption.reward.default_image) {
        const images = redemptionMessage._data.data.redemption.reward.default_image;
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
            name: redemptionMessage.rewardName,
            cost: redemptionMessage.rewardCost,
            imageUrl: imageUrl
        }
    });

    setTimeout(() => {
        eventManager.triggerEvent("twitch", "channel-reward-redemption", {
            username: redemptionMessage.userDisplayName,
            messageText: redemptionMessage.message,
            rewardId: redemptionMessage.rewardId,
            rewardImage: imageUrl,
            rewardName: redemptionMessage.rewardName,
            rewardCost: redemptionMessage.rewardCost
        });
    }, 250);
};
