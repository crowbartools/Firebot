"use strict";
const logger = require("../../logwrapper");
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

    logger.info("Connecting to Twitch PubSub...");

    pubSubClient = new PubSubClient();
    try {
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
    } catch (err) {
        logger.error("Failed to connect to Twitch PubSub!", err);
        return;
    }

    logger.info("Connected to the Twitch PubSub!");
}

exports.createClient = createClient;
exports.removeListeners = removeListeners;

