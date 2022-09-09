"use strict";
const logger = require("../../logwrapper");
const accountAccess = require("../../common/account-access");
const frontendCommunicator = require("../../common/frontend-communicator");
const refreshingAuthProvider = require("../../auth/refreshing-auth-provider");
const { PubSubClient } = require("@twurple/pubsub");

/**@type {PubSubClient} */
let pubSubClient;

/**@type {Array<import("@twurple/pubsub").PubSubListener>} */
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

    const authProvider = refreshingAuthProvider.getRefreshingAuthProviderForStreamer();

    try {
        // throws error if one doesn't exist
        pubSubClient.getUserListener(streamer.userId);
    } catch (err) {
        await pubSubClient.registerUserListener(authProvider, streamer.userId);
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

        const bitsListener = await pubSubClient.onBits(streamer.userId, (message) => {
            twitchEventsHandler.cheer.triggerCheer(message);
        });
        listeners.push(bitsListener);

        const bitsBadgeUnlockListener = await pubSubClient.onBitsBadgeUnlock(streamer.userId, (message) => {
            twitchEventsHandler.cheer.triggerBitsBadgeUnlock(message);
        });
        listeners.push(bitsBadgeUnlockListener);

        const subsListener = await pubSubClient.onSubscription(streamer.userId, (subInfo) => {
            if (!subInfo.isGift) {
                twitchEventsHandler.sub.triggerSub(subInfo);
            }
        });
        listeners.push(subsListener);

        const autoModListener = await pubSubClient.onAutoModQueue(streamer.userId, streamer.userId, async (message) => {
            if (message.status === "PENDING") {
                const { buildViewerFirebotChatMessageFromAutoModMessage } = require("../../chat/chat-helpers");

                const firebotChatMessage = await buildViewerFirebotChatMessageFromAutoModMessage(message);

                frontendCommunicator.send("twitch:chat:message", firebotChatMessage);
            }
            if (["ALLOWED", "DENIED", "EXPIRED"].includes(message.status)) {
                frontendCommunicator.send("twitch:chat:automod-update", {
                    messageId: message.messageId,
                    newStatus: message.status,
                    resolverName: message.resolverName,
                    resolverId: message.resolverId,
                    flaggedPhrases: message.foundMessageFragments.filter(f => !!f.automod).map(f => f.text)
                });
            }
        });
        listeners.push(autoModListener);

        const modListener = await pubSubClient.onModAction(streamer.userId, streamer.userId, (message) => {
            const frontendCommunicator = require("../../common/frontend-communicator");

            switch (message.action) {
            case "clear":
                frontendCommunicator.send("twitch:chat:clear-feed", message.userName);
                break;
            case "ban":
                twitchEventsHandler.viewerBanned.triggerBanned(message);
                frontendCommunicator.send("twitch:chat:user:delete-messages", message.args[0]);
                break;
            case "timeout":
                twitchEventsHandler.viewerTimeout.triggerTimeout(message);
                frontendCommunicator.send("twitch:chat:user:delete-messages", message.args[0]);
                break;
            case "emoteonly":
            case "emoteonlyoff":
            case "subscribers":
            case "subscribersoff":
            case "followers":
            case "followersoff":
            case "slow":
            case "slowoff":
            case "r9kbeta": // Unique Chat
            case "r9kbetaoff":
                twitchEventsHandler.chatModeChanged.triggerChatModeChanged(message);
                break;
            default:
                return;
            }
        });
        listeners.push(modListener);

        const chatRoomListener = await pubSubClient.onCustomTopic(streamer.userId, "stream-chat-room-v1", async (event) => {
            const message = event?.data;
            if (message?.type === "extension_message") {
                const twitchApi = require("../api").getClient();
                const extension = await twitchApi.extensions.getReleasedExtension(message.data.sender.extension_client_id);

                const { buildFirebotChatMessageFromExtensionMessage } = require("../../chat/chat-helpers");
                const firebotChatMessage = await buildFirebotChatMessageFromExtensionMessage(
                    message.data.content.text,
                    message.data.sender.display_name,
                    extension.getIconUrl("100x100"),
                    message.data.sender.badges,
                    message.data.sender.chat_color,
                    message.data.id
                );

                frontendCommunicator.send("twitch:chat:message", firebotChatMessage);
            }
        });
        listeners.push(chatRoomListener);

    } catch (err) {
        logger.error("Failed to connect to Twitch PubSub!", err);
        return;
    }

    logger.info("Connected to the Twitch PubSub!");
}

exports.createClient = createClient;
exports.disconnectPubSub = disconnectPubSub;
exports.removeListeners = removeListeners;

