"use strict";
const accountAccess = require("../../common/account-access");
const twitchClient = require("../client");

const PubSubClient = require("twitch-pubsub-client").default;

/**@type {import("twitch-pubsub-client").default} */
let prepubescent;

/**@type {import("twitch-pubsub-client").PubSubListener[]} */
let listeners = [];

function removeListeners() {
    for (const listener of listeners) {
        listener.remove();
    }
    listeners = [];
}

async function createClient() {
    removeListeners();

    prepubescent = new PubSubClient();
    const apiClient = twitchClient.getClient();
    await prepubescent.registerUserListener(apiClient);

    const streamer = accountAccess.getAccounts().streamer;

    const eventManager = require("../../events/EventManager");
    const redemptionListener = await prepubescent.onRedemption(streamer.userId, (message) => {
        eventManager.triggerEvent("twitch", "channel-reward-redemption", {
            username: message.userDisplayName,
            messageText: message.message,
            rewardId: message.rewardId,
            rewardImage: message.rewardImage,
            rewardName: message.rewardName,
            rewardCost: message.rewardCost
        });
    });

    listeners.push(redemptionListener);
}

exports.createClient = createClient;
exports.removeListeners = removeListeners;

