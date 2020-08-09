"use strict";
const accountAccess = require("../../common/account-access");
const twitchClient = require("../client");

const PubSubClient = require("twitch-pubsub-client").default;

/**@type {import("twitch-pubsub-client").default} */
let pubSubClient;

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

    pubSubClient = new PubSubClient();
    const apiClient = twitchClient.getClient();
    await pubSubClient.registerUserListener(apiClient);

    const streamer = accountAccess.getAccounts().streamer;

    const rewardRedemptionHandler =
        require("../../events/twitch-events/reward-redemption");
    const redemptionListener = await pubSubClient.onRedemption(streamer.userId,
        (message) => {
            rewardRedemptionHandler.handleRewardRedemption(message);
        });

    listeners.push(redemptionListener);
}

exports.createClient = createClient;
exports.removeListeners = removeListeners;

