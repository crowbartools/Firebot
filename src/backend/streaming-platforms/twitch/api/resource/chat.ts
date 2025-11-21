import {
    HelixChatAnnouncementColor,
    HelixChatChatter,
    HelixSendChatAnnouncementParams,
    HelixSentChatMessage,
    HelixUpdateChatSettingsParams,
    HelixUserEmote
} from "@twurple/api";
import type { SharedChatParticipant } from '../../../../../types';
import { ApiResourceBase } from "./api-resource-base";
import type { TwitchApi } from "../";
import { TwitchSlashCommandHandler } from "../../chat/twitch-slash-command-handler";
import frontendCommunicator from '../../../../common/frontend-communicator';

interface ResultWithError<TResult, TError> {
    success: boolean;
    result?: TResult;
    error?: TError;
}

interface ChatMessageRequest {
    message: string;
    accountType: string;
    replyToMessageId?: string;
}

export class TwitchChatApi extends ApiResourceBase {
    private _slashCommandHandler: TwitchSlashCommandHandler;

    constructor(apiBase: typeof TwitchApi) {
        super(apiBase);

        this._slashCommandHandler = new TwitchSlashCommandHandler(apiBase);

        frontendCommunicator.onAsync("send-chat-message", async (sendData: ChatMessageRequest) => {
            const { message, accountType, replyToMessageId } = sendData;

            await this.sendChatMessage(message, replyToMessageId, accountType.toLowerCase() === "bot");
        });

        frontendCommunicator.onAsync("delete-message", async (messageId: string) => {
            return await this.deleteChatMessage(messageId);
        });
    }

    /**
     * Gets the list of all chatters in the channel.
     */
    async getAllChatters(): Promise<HelixChatChatter[]> {
        const chatters: HelixChatChatter[] = [];

        try {
            const streamerUserId: string = this.accounts.streamer.userId;

            chatters.push(...await this.streamerClient.chat.getChattersPaginated(streamerUserId).getAll());
        } catch (error) {
            this.logger.error("Error getting chatter list", (error as Error).message);
        }

        return chatters;
    }

    /**
     * Sends a chat message to the streamer's chat.
     *
     * @param message Chat message to send.
     * @param replyToMessageId The ID of the message this should be replying to. Leave as null for non replies.
     * @param sendAsBot If the chat message should be sent as the bot or not.
     * If this is set to `false` or the bot account is not logged in, the chat message will be sent as the streamer.
     * @returns `true` if sending the chat message was successful or `false` if it failed
     */
    async sendChatMessage(message: string, replyToMessageId: string = null, sendAsBot = false): Promise<boolean> {
        if (!message?.length) {
            return false;
        }

        try {
            // Determine sender
            const streamerUserId: string = this.accounts.streamer.userId;
            const willSendAsBot: boolean = sendAsBot === true
                && this.accounts.bot?.userId != null
                && this.botClient != null;

            // Slash command processing
            const slashCommandValidationResult = this._slashCommandHandler
                .validateChatCommand(message);

            // If the slash command handler finds, validates, and successfully executes a command, no need to continue.
            if (slashCommandValidationResult != null
                && slashCommandValidationResult.success === true
            ) {
                const slashCommandResult = await this._slashCommandHandler
                    .processChatCommand(
                        message,
                        willSendAsBot
                    );

                if (!slashCommandResult) {
                    frontendCommunicator.send("chatUpdate", {
                        fbEvent: "ChatAlert",
                        message: `Failed to execute "${message}"`
                    });
                }

                return slashCommandResult;
            }

            if (slashCommandValidationResult != null
                && slashCommandValidationResult.success === false
                && slashCommandValidationResult.foundCommand !== false
            ) {
                frontendCommunicator.send("chatUpdate", {
                    fbEvent: "ChatAlert",
                    message: slashCommandValidationResult.errorMessage
                });
            }

            const messageFragments = message
                .match(/[\s\S]{1,500}/g)
                .map(mf => mf.trim())
                .filter(mf => mf !== "");
            let result: HelixSentChatMessage;

            for (const fragment of messageFragments) {
                if (willSendAsBot === true) {
                    result = await this.botClient.chat.sendChatMessage(streamerUserId, fragment, { replyParentMessageId: replyToMessageId });
                } else {
                    result = await this.streamerClient.chat.sendChatMessage(streamerUserId, fragment, { replyParentMessageId: replyToMessageId });
                }

                if (result.isSent !== true) {
                    this.logger.error(`Twitch dropped chat message. Reason: ${result.dropReasonMessage}`);
                    return false;
                }
            }

            return result.isSent;
        } catch (error) {
            this.logger.error(`Unable to send ${sendAsBot === true ? "bot" : "steamer"} chat message`, error);
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
        const streamerUserId: string = this.accounts.streamer.userId;
        const willSendAsBot: boolean = sendAsBot === true
            && this.accounts.bot?.userId != null
            && this.botClient != null;

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
                    await this.botClient.chat.sendAnnouncement(streamerUserId, announcement);
                } else {
                    await this.streamerClient.chat.sendAnnouncement(streamerUserId, announcement);
                }
            }

            return true;
        } catch (error) {
            this.logger.error("Error sending announcement", (error as Error).message);
        }

        return false;
    }

    /**
     * Sends a Twitch shoutout to another channel
     *
     * @param targetUserId The Twitch user ID whose channel to shoutout
     * @returns true when successful, error message string when unsuccessful
     */
    async sendShoutout(targetUserId: string): Promise<ResultWithError<undefined, string>> {
        const streamerId = this.accounts.streamer.userId;

        try {
            await this.moderationClient.chat.shoutoutUser(streamerId, targetUserId);
        } catch (error) {
            this.logger.error("Error sending shoutout", (error as Error).message);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            const body = JSON.parse(error._body as string) as { message?: string };
            return { success: false, error: body.message };
        }
        return { success: true };
    }

    /**
     * Deletes a chat message from the streamer's chat.
     *
     * @param messageId The ID of the message to delete
     * @returns `true` if the message was deleted or `false` if it failed
     */
    async deleteChatMessage(messageId: string): Promise<boolean> {
        const streamerUserId: string = this.accounts.streamer.userId;

        try {
            await this.moderationClient.moderation.deleteChatMessages(streamerUserId, messageId);

            return true;
        } catch (error) {
            this.logger.error("Error deleting chat message", (error as Error).message);
        }

        return false;
    }

    /**
     * Clears the streamer's chat.
     *
     * @returns `true` if chat was cleared or `false` if it failed
     */
    async clearChat(): Promise<boolean> {
        const streamerUserId: string = this.accounts.streamer.userId;

        try {
            await this.moderationClient.moderation.deleteChatMessages(streamerUserId);

            return true;
        } catch (error) {
            this.logger.error("Error clearing chat", (error as Error).message);
        }

        return false;
    }

    /**
     * Turns emote-only mode on or off in the streamer's chat.
     *
     * @param enable `true` will enable emote-only mode. `false` will disable emote-only mode. Defaults to `true`.
     * @returns `true` if the update succeeded or `false` if it failed
     */
    async setEmoteOnlyMode(enable = true): Promise<boolean> {
        const streamerUserId: string = this.accounts.streamer.userId;

        try {
            const chatSettings: HelixUpdateChatSettingsParams = {
                emoteOnlyModeEnabled: enable
            };

            await this.moderationClient.chat.updateSettings(streamerUserId, chatSettings);

            return true;
        } catch (error) {
            this.logger.error("Error setting emote-only mode", (error as Error).message);
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
    async setFollowerOnlyMode(enable = true, duration = 0): Promise<boolean> {
        const streamerUserId: string = this.accounts.streamer.userId;

        try {
            const chatSettings: HelixUpdateChatSettingsParams = {
                followerOnlyModeEnabled: enable,
                followerOnlyModeDelay: duration
            };

            await this.moderationClient.chat.updateSettings(streamerUserId, chatSettings);

            return true;
        } catch (error) {
            this.logger.error("Error setting follower-only mode", (error as Error).message);
        }

        return false;
    }

    /**
     * Turns subscriber-only mode on or off in the streamer's chat.
     *
     * @param enable `true` will enable subscriber-only mode. `false` will disable subscriber-only mode. Defaults to `true`.
     * @returns `true` if the update succeeded or `false` if it failed
     */
    async setSubscriberOnlyMode(enable = true): Promise<boolean> {
        const streamerUserId: string = this.accounts.streamer.userId;

        try {
            const chatSettings: HelixUpdateChatSettingsParams = {
                subscriberOnlyModeEnabled: enable
            };

            await this.moderationClient.chat.updateSettings(streamerUserId, chatSettings);

            return true;
        } catch (error) {
            this.logger.error("Error setting subscriber-only mode", (error as Error).message);
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
    async setSlowMode(enable = true, duration = 5): Promise<boolean> {
        const streamerUserId: string = this.accounts.streamer.userId;

        try {
            const chatSettings: HelixUpdateChatSettingsParams = {
                slowModeEnabled: enable,
                slowModeDelay: enable === true ? duration : null
            };

            await this.moderationClient.chat.updateSettings(streamerUserId, chatSettings);

            return true;
        } catch (error) {
            this.logger.error("Error setting slow mode", (error as Error).message);
        }

        return false;
    }

    /**
     * Turns unique mode on or off in the streamer's chat.
     *
     * @param enable `true` will enable unique mode. `false` will disable unique mode. Defaults to `true`.
     * @returns `true` if the update succeeded or `false` if it failed
     */
    async setUniqueMode(enable = true): Promise<boolean> {
        const streamerUserId: string = this.accounts.streamer.userId;

        try {
            const chatSettings: HelixUpdateChatSettingsParams = {
                uniqueChatModeEnabled: enable
            };

            await this.moderationClient.chat.updateSettings(streamerUserId, chatSettings);

            return true;
        } catch (error) {
            this.logger.error("Error setting unique mode", (error as Error).message);
        }

        return false;
    }

    /**
     * Gets the chat color for a user.
     *
     * @param targetUserId numerical ID of the user as sting.
     * @returns the color as hex code, null if the user did not set a color, or undefined if the user is unknown.
     */
    async getColorForUser(targetUserId: string): Promise<string> {
        try {
            return await this.streamerClient.chat.getColorForUser(targetUserId);
        } catch (error) {
            this.logger.error("Error Receiving user color", (error as Error).message);
            return null;
        }
    }

    /**
     * Gets all emotes that can be used on Twitch by the specified Firebot account.
     *
     * @param account Either `streamer` or `bot`
     * @returns An array of {@link HelixUserEmote} containing all the emotes the user can use on Twitch, or null if the request failed
     */
    async getAllUserEmotes(account: "streamer" | "bot" = "streamer"): Promise<HelixUserEmote[]> {
        const streamerUserId = this.accounts.streamer.userId;
        let userId = streamerUserId;
        let client = this.streamerClient;

        if (account === "bot") {
            const bot = this.accounts.bot;
            if (bot.loggedIn !== true) {
                return [];
            }

            userId = bot.userId;
            client = this.botClient;
        }

        try {
            const emotes = await client.chat.getUserEmotesPaginated(userId, streamerUserId).getAll();

            // Filter out any duplicates that may come back from the API
            return emotes.filter((emote, index, arr) => arr.findIndex(e => emote.id === e.id) === index);
        } catch (error) {
            this.logger.error(`Error getting all user emotes for ${account}`, (error as Error).message);
            return null;
        }
    }

    /**
     * Gets the participants in the current shared chat session.
     *
     * @returns An array of {@link SharedChatParticipant} containing all the participants in the shared chat session, or null if there is no active session
     */
    async getSharedChatParticipants(): Promise<SharedChatParticipant[]> {
        try {
            const streamerId = this.accounts.streamer.userId;
            const session = await this.streamerClient.chat.getSharedChatSession(streamerId);

            if (!session) {
                return null;
            }

            const twitchUsers = await this.usersApi.getUsersByIds(session.participants.map(participant => participant.broadcasterId));

            return twitchUsers.map(user => ({
                broadcasterId: user.id,
                broadcasterName: user.name,
                broadcasterDisplayName: user.displayName,
                profilePictureUrl: user.profilePictureUrl
            }));
        } catch (err) {
            const error = err as Error;
            this.logger.error(`Failed to get shared chat session`, error.message);
        }
    }
}