"use strict";
const logger = require("../../logwrapper");
const accountAccess = require("../../common/account-access");
const twitchClient = require("../client");

const { PubSubClient } = require("twitch-pubsub-client");

/**@type {PubSubClient} */
let pubSubClient;

/**@type {Array<import("twitch-pubsub-client").PubSubListener>} */
let listeners = [];

/**
 *
 * @param {PubSubClient} pubSubClient
 */
async function removeListeners(pubSubClient) {
    if (pubSubClient) {
        let userListener;
        try {
            userListener = pubSubClient.getUserListener(
                accountAccess.getAccounts().streamer.userId
            );
        } catch (error) {
            console.log(error);
        }
        if (userListener) {
            for (const listener of listeners) {
                try {
                    await userListener.removeListener(listener);
                    await listener.remove();
                } catch (error) {
                    console.log(error);
                }
            }
        }
    } else {
        for (const listener of listeners) {
            try {
                await listener.remove();
            } catch (error) {
                logger.debug("failed to remove pubsub listener without client", error);
            }
        }
    }
    listeners = [];
}

async function disconnectPubSub() {
    await removeListeners(pubSubClient);
    try {
        if (pubSubClient && pubSubClient._rootClient && pubSubClient._rootClient.isConnected) {
            pubSubClient._rootClient.disconnect();
            logger.info("Disconnected from PubSub.");
        }
    } catch (err) {
        logger.debug("error disconnecting pubsub", err);
    }
}

async function createClient() {

    const streamer = accountAccess.getAccounts().streamer;

    await disconnectPubSub();

    logger.info("Connecting to Twitch PubSub...");

    pubSubClient = new PubSubClient();

    const apiClient = twitchClient.getClient();

    try {
        // throws error if one doesnt exist
        pubSubClient.getUserListener(streamer.userId);
    } catch (err) {
        await pubSubClient.registerUserListener(apiClient, streamer.userId);
    }

    await removeListeners(pubSubClient);

    try {
        const twitchEventsHandler = require('../../events/twitch-events');

        const redemptionListener = await pubSubClient.onRedemption(streamer.userId,
            (message) => {
                twitchEventsHandler.rewardRedemption.handleRewardRedemption(message);
            });

        listeners.push(redemptionListener);

        const whisperListener = await pubSubClient.onWhisper(streamer.userId, (message) => {
            twitchEventsHandler.whisper.triggerWhisper(message.senderName, message.text);
        });
        listeners.push(whisperListener);

        const bitsListener = await pubSubClient.onBits(streamer.userId, (event) => {
            twitchEventsHandler.cheer.triggerCheer(event.userName, event.isAnonymous, event.bits, event.totalBits, event.message);
        });
        listeners.push(bitsListener);

        const subsListener = await pubSubClient.onSubscription(streamer.userId, (subInfo) => {
            if (subInfo._data["context"] === "sub" || subInfo._data["context"] === "resub") {
                twitchEventsHandler.sub.triggerSub(subInfo);
            } else {
                twitchEventsHandler.giftSub.triggerSubGift(subInfo);
            }
        });
        listeners.push(subsListener);
    } catch (err) {
        logger.error("Failed to connect to Twitch PubSub!", err);
        return;
    }

    logger.info("Connected to the Twitch PubSub!");
}

exports.createClient = createClient;
exports.disconnectPubSub = disconnectPubSub;
exports.removeListeners = removeListeners;

