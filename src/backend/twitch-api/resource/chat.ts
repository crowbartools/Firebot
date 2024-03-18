import logger from '../../logwrapper';
import accountAccess from "../../common/account-access";
import { ApiClient, HelixChatAnnouncementColor, HelixChatChatter, HelixSendChatAnnouncementParams, HelixSentChatMessage, HelixUpdateChatSettingsParams } from "@twurple/api";

export class TwitchChatApi {
    private _streamerClient: ApiClient;
    private _botClient: ApiClient;

    constructor(streamerClient: ApiClient, botClient: ApiClient) {
        this._streamerClient = streamerClient;
        this._botClient = botClient;
    }

    /**
     * Gets the list of all chatters in the channel.
     */
    async getAllChatters(): Promise<HelixChatChatter[]> {
        const chatters: HelixChatChatter[] = [];

        try {
            const streamerUserId: string = accountAccess.getAccounts().streamer.userId;

            chatters.push(...await this._streamerClient.chat.getChattersPaginated(streamerUserId).getAll());
        } catch (error) {
            logger.error("Error getting chatter list", error.message);
        }

        return chatters;
    }

    /**
     * Sends a chat message to the streamer's chat.
     *
     * @param message Chat message to send.
     * @param replyToMessageId The ID of the message this should be replying to. Leave as null for non replies.
     * @param sendAsBot If the chat message should be sent as the bot or not.
     * If this is set to `false`, the chat message will be sent as the streamer.
     * @returns `true` if sending the chat message was successful or `false` if it failed
     */
    async sendChatMessage(message: string, replyToMessageId = null, sendAsBot = false): Promise<boolean> {
        if (!message?.length) {
            return false;
        }

        try {
            const streamerUserId: string = accountAccess.getAccounts().streamer.userId;
            const willSendAsBot: boolean = sendAsBot === true
                && accountAccess.getAccounts().bot?.userId != null
                && this._botClient != null;

            let result: HelixSentChatMessage;

            if (willSendAsBot === true) {
                result = await this._botClient.chat.sendChatMessage(streamerUserId, message, { replyParentMessageId: replyToMessageId });
            } else {
                result = await this._streamerClient.chat.sendChatMessage(streamerUserId, message, { replyParentMessageId: replyToMessageId });
            }

            if (result.isSent !== true) {
                logger.error(`Twitch dropped chat message. Reason: ${result.dropReasonMessage}`);
            }

            return result.isSent;
        } catch (error) {
            logger.error(`Unable to send ${sendAsBot === true ? "bot" : "steamer"} chat message`, error);
        }

        return false;
    }

    /**
     * Sends an announcement to the streamer's chat.
     *
     * @param message The announcement to send
     * @param color The color of the announcement. Options include `primary`, `blue`, `green`, `orange`, and `purple`.
     * Defaults to `primary`, the streamer's brand color.
     * @param sendAsBot If the announcement should be sent as the bot or not.
     * If this is set to `false`, the announcement will be sent as the streamer.
     * @returns `true` if the announcement was successful or `false` if it failed
     */
    async sendAnnouncement(
        message: string,
        color: HelixChatAnnouncementColor = "primary",
        sendAsBot = false
    ): Promise<boolean> {
        const streamerUserId: string = accountAccess.getAccounts().streamer.userId;
        const willSendAsBot: boolean = sendAsBot === true
            && accountAccess.getAccounts().bot?.userId != null
            && this._botClient != null;

        if (message?.length < 1) {
            return;
        }

        try {
            // split message into fragments so we don't exceed the max message length
            const messageFragments = message.match(/[\s\S]{1,500}/g)
                .map(mf => mf.trim())
                .filter(mf => mf !== "");

            for (const fragment of messageFragments) {
                const announcement: HelixSendChatAnnouncementParams = {
                    message: fragment,
                    color: color
                };

                if (willSendAsBot === true) {
                    await this._botClient.chat.sendAnnouncement(streamerUserId, announcement);
                } else {
                    await this._streamerClient.chat.sendAnnouncement(streamerUserId, announcement);
                }
            }

            return true;
        } catch (error) {
            logger.error("Error sending announcement", error.message);
        }

        return false;
    }

    /**
     * Sends a Twitch shoutout to another channel
     *
     * @param targetUserId The Twitch user ID whose channel to shoutout
     */
    async sendShoutout(targetUserId: string): Promise<boolean> {
        const streamerId = accountAccess.getAccounts().streamer.userId;

        try {
            await this._streamerClient.chat.shoutoutUser(streamerId, targetUserId);
        } catch (error) {
            logger.error("Error sending shoutout", error.message);
            return false;
        }

        return true;
    }

    /**
     * Deletes a chat message from the streamer's chat.
     *
     * @param messageId The ID of the message to delete
     * @returns `true` if the message was deleted or `false` if it failed
     */
    async deleteChatMessage(messageId: string): Promise<boolean> {
        const streamerUserId: string = accountAccess.getAccounts().streamer.userId;

        try {
            await this._streamerClient.moderation.deleteChatMessages(streamerUserId, messageId);

            return true;
        } catch (error) {
            logger.error("Error deleting chat message", error.message);
        }

        return false;
    }

    /**
     * Clears the streamer's chat.
     *
     * @returns `true` if chat was cleared or `false` if it failed
     */
    async clearChat(): Promise<boolean> {
        const streamerUserId: string = accountAccess.getAccounts().streamer.userId;

        try {
            await this._streamerClient.moderation.deleteChatMessages(streamerUserId);

            return true;
        } catch (error) {
            logger.error("Error clearing chat", error.message);
        }

        return false;
    }

    /**
     * Turns emote-only mode on or off in the streamer's chat.
     *
     * @param enable `true` will enable emote-only mode. `false` will disable emote-only mode. Defaults to `true`.
     * @returns `true` if the update succeeded or `false` if it failed
     */
    async setEmoteOnlyMode(enable = true) {
        const streamerUserId: string = accountAccess.getAccounts().streamer.userId;

        try {
            const chatSettings: HelixUpdateChatSettingsParams = {
                emoteOnlyModeEnabled: enable
            };

            await this._streamerClient.chat.updateSettings(streamerUserId, chatSettings);

            return true;
        } catch (error) {
            logger.error("Error setting emote-only mode", error.message);
        }

        return false;
    }

    /**
     * Turns follower-only mode on or off in the streamer's chat.
     *
     * @param enable `true` will enable follower-only mode. `false` will disable follower-only mode. Defaults to `true`.
     * @param duration Duration in minutes that a user must be following the channel before they're allowed to chat. Default is `0`.
     * @returns `true` if the update succeeded or `false` if it failed
     */
    async setFollowerOnlyMode(enable = true, duration = 0) {
        const streamerUserId: string = accountAccess.getAccounts().streamer.userId;

        try {
            const chatSettings: HelixUpdateChatSettingsParams = {
                followerOnlyModeEnabled: enable,
                followerOnlyModeDelay: duration
            };

            await this._streamerClient.chat.updateSettings(streamerUserId, chatSettings);

            return true;
        } catch (error) {
            logger.error("Error setting follower-only mode", error.message);
        }

        return false;
    }

    /**
     * Turns subscriber-only mode on or off in the streamer's chat.
     *
     * @param enable `true` will enable subscriber-only mode. `false` will disable subscriber-only mode. Defaults to `true`.
     * @returns `true` if the update succeeded or `false` if it failed
     */
    async setSubscriberOnlyMode(enable = true) {
        const streamerUserId: string = accountAccess.getAccounts().streamer.userId;

        try {
            const chatSettings: HelixUpdateChatSettingsParams = {
                subscriberOnlyModeEnabled: enable
            };

            await this._streamerClient.chat.updateSettings(streamerUserId, chatSettings);

            return true;
        } catch (error) {
            logger.error("Error setting subscriber-only mode", error.message);
        }

        return false;
    }

    /**
     * Turns slow mode on or off in the streamer's chat.
     *
     * @param enable `true` will enable slow mode. `false` will disable slow mode. Defaults to `true`.
     * @param duration Duration in seconds that a user must wait between sending messages. Default is `5`.
     * @returns `true` if the update succeeded or `false` if it failed
     */
    async setSlowMode(enable = true, duration = 5) {
        const streamerUserId: string = accountAccess.getAccounts().streamer.userId;

        try {
            const chatSettings: HelixUpdateChatSettingsParams = {
                slowModeEnabled: enable,
                slowModeDelay: enable === true ? duration : null
            };

            await this._streamerClient.chat.updateSettings(streamerUserId, chatSettings);

            return true;
        } catch (error) {
            logger.error("Error setting slow mode", error.message);
        }

        return false;
    }

    /**
     * Turns unique mode on or off in the streamer's chat.
     *
     * @param enable `true` will enable unique mode. `false` will disable unique mode. Defaults to `true`.
     * @returns `true` if the update succeeded or `false` if it failed
     */
    async setUniqueMode(enable = true) {
        const streamerUserId: string = accountAccess.getAccounts().streamer.userId;

        try {
            const chatSettings: HelixUpdateChatSettingsParams = {
                uniqueChatModeEnabled: enable
            };

            await this._streamerClient.chat.updateSettings(streamerUserId, chatSettings);

            return true;
        } catch (error) {
            logger.error("Error setting unique mode", error.message);
        }

        return false;
    }

    /**
     * Gets the chat color for a user.
     *
     * @param targetUserId numerical ID of the user as sting.
     * @returns the color as hex code, null if the user did not set a color, or undefined if the user is unknown.
     */
    async getColorForUser(targetUserId: string): Promise<string | null |undefined> {
        try {
            return await this._streamerClient.chat.getColorForUser(targetUserId);
        } catch (error) {
            logger.error("Error Receiving user color", error.message);
            return null;
        }
    }
}