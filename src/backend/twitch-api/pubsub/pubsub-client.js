"use strict";
const logger = require("../../logwrapper");
const accountAccess = require("../../common/account-access");
const frontendCommunicator = require("../../common/frontend-communicator");
const firebotDeviceAuthProvider = require("../../auth/firebot-device-auth-provider");
const chatRolesManager = require("../../roles/chat-roles-manager");
const { PubSubClient } = require("@twurple/pubsub");
const chatCommandHandler = require("../../chat/commands/chat-command-handler");

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
        for (const listener of listeners) {
            try {
                pubSubClient.removeListener(listener);
                await listener.remove();
            } catch (error) {
                console.log(error);
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
        if (pubSubClient && pubSubClient._basicClient && pubSubClient._basicClient.isConnected) {
            pubSubClient._basicClient.disconnect();
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

    const authProvider = firebotDeviceAuthProvider.streamerProvider;

    pubSubClient = new PubSubClient({ authProvider });

    await removeListeners(pubSubClient);

    try {
        const twitchEventsHandler = require('../../events/twitch-events');

        const bitsBadgeUnlockListener = pubSubClient.onBitsBadgeUnlock(streamer.userId, (message) => {
            twitchEventsHandler.cheer.triggerBitsBadgeUnlock(
                message.userName ?? "ananonymouscheerer",
                message.userId,
                message.userName ?? "An Anonymous Cheerer",
                message.message ?? "",
                message.badgeTier
            );
        });
        listeners.push(bitsBadgeUnlockListener);

        const subsListener = pubSubClient.onSubscription(streamer.userId, (subInfo) => {
            if (!subInfo.isGift) {
                twitchEventsHandler.sub.triggerSub(
                    subInfo.userName,
                    subInfo.userId,
                    subInfo.userDisplayName,
                    subInfo.subPlan,
                    subInfo.cumulativeMonths || 1,
                    subInfo.message.message ?? "",
                    subInfo.streakMonths || 1,
                    subInfo.subPlan === "Prime",
                    subInfo.isResub
                );
            }
        });
        listeners.push(subsListener);

        const autoModListener = pubSubClient.onAutoModQueue(streamer.userId, streamer.userId, async (message) => {
            if (message.status === "PENDING") {
                const chatHelpers = require("../../chat/chat-helpers");

                const firebotChatMessage = await chatHelpers.buildViewerFirebotChatMessageFromAutoModMessage(message);

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

        const modListener = pubSubClient.onModAction(streamer.userId, streamer.userId, (message) => {
            const frontendCommunicator = require("../../common/frontend-communicator");

            switch (message.type) {
                case "vip_added":
                    chatRolesManager.addVipToVipList({
                        id: message.targetUserId,
                        username: message.targetUserName
                    });
                    break;
                default:
                    switch (message.action) {
                        case "clear": {
                            const { userName, userId } = message;
                            frontendCommunicator.send("twitch:chat:clear-feed", userName);
                            twitchEventsHandler.chat.triggerChatCleared(userName, userId);
                            break;
                        }
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
                            twitchEventsHandler.chatModeChanged.triggerChatModeChanged(
                                message.action,
                                message.action.includes("off") ? "disabled" : "enabled",
                                message.userName,
                                message.args ? parseInt(message.args[0]) : null
                            );
                            break;
                        default:
                            return;
                    }
                    break;
            }
        });
        listeners.push(modListener);

        const chatRoomListener = pubSubClient.onCustomTopic(streamer.userId, "stream-chat-room-v1", async (event) => {
            const message = event?.data;
            if (message?.type === "extension_message") {
                const twitchApi = require("../api").streamerClient;
                const extension = await twitchApi.extensions.getReleasedExtension(message.data.sender.extension_client_id);

                const chatHelpers = require("../../chat/chat-helpers");
                const firebotChatMessage = await chatHelpers.buildFirebotChatMessageFromExtensionMessage(
                    message.data.content.text,
                    message.data.sender.display_name,
                    extension.getIconUrl("100x100"),
                    message.data.sender.badges,
                    message.data.sender.chat_color,
                    message.data.id
                );

                frontendCommunicator.send("twitch:chat:message", firebotChatMessage);
                chatCommandHandler.handleChatMessage(firebotChatMessage);
                twitchEventsHandler.chatMessage.triggerChatMessage(firebotChatMessage);
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
