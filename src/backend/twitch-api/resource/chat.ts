import logger from '../../logwrapper';
import twitchApi from "../api";
import accountAccess from "../../common/account-access";
import { ApiClient, HelixChatAnnouncementColor, HelixSendChatAnnouncementParams, HelixUpdateChatSettingsParams } from "@twurple/api";

/**
 * Gets the list of all chatters in the channel.
 */
export async function getAllChatters(): Promise<string[]> {
    const chatters: string[] = [];

    try {
        const client: ApiClient = twitchApi.getClient();
        const streamerUserId: number = accountAccess.getAccounts().streamer.userId;

        let result = await client.chat.getChatters(streamerUserId, streamerUserId);
        chatters.push(...result.data.map(c => c.userDisplayName));

        while (result.cursor) {
            result = await client.chat.getChatters(streamerUserId, streamerUserId, { after: result.cursor });
            chatters.push(...result.data.map(c => c.userDisplayName));
        }
    } catch (error) {
        logger.error("Error getting chatter list", error);
    }

    return chatters;
};

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
export async function sendAnnouncement(
    message: string,
    color: HelixChatAnnouncementColor = "primary",
    sendAsBot: boolean = false
): Promise<boolean> {
    const client: ApiClient = sendAsBot === true ? twitchApi.getBotClient() : twitchApi.getClient();
    const streamerUserId: number = accountAccess.getAccounts().streamer.userId;
    let senderUserId: number = sendAsBot === true && accountAccess.getAccounts().bot?.userId != null ?
        accountAccess.getAccounts().bot.userId :
        streamerUserId;

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
    
            await client.chat.sendAnnouncement(streamerUserId, senderUserId, announcement);
        }

        return true;
    } catch (error) {
        logger.error("Error sending announcemnt", error);
    }

    return false;
};

/**
 * Deletes a chat message from the streamer's chat.
 * 
 * @param messageId The ID of the message to delete
 * @returns `true` if the message was deleted or `false` if it failed
 */
export async function deleteChatMessage(messageId: string): Promise<boolean> {
    const client: ApiClient = twitchApi.getClient();
    const streamerUserId: number = accountAccess.getAccounts().streamer.userId;

    try {
        await client.moderation.deleteChatMessages(streamerUserId, streamerUserId, messageId);

        return true;
    } catch (error) {
        logger.error("Error clearing chat", error);
    }

    return false;
};

/**
 * Clears the streamer's chat.
 * 
 * @returns `true` if chat was cleared or `false` if it failed
 */
export async function clearChat(): Promise<boolean> {
    const client: ApiClient = twitchApi.getClient();
    const streamerUserId: number = accountAccess.getAccounts().streamer.userId;

    try {
        await client.moderation.deleteChatMessages(streamerUserId, streamerUserId);

        return true;
    } catch (error) {
        logger.error("Error clearing chat", error);
    }

    return false;
};

/**
 * Turns emote-only mode on or off in the streamer's chat.
 * 
 * @param enable `true` will enable emote-only mode. `false` will disable emote-only mode. Defaults to `true`.
 * @returns `true` if the update succeeded or `false` if it failed
 */
export async function setEmoteOnlyMode(enable: boolean = true) {
    const client: ApiClient = twitchApi.getClient();
    const streamerUserId: number = accountAccess.getAccounts().streamer.userId;

    try {
        const chatSettings: HelixUpdateChatSettingsParams = {
            emoteOnlyModeEnabled: enable
        };

        await client.chat.updateSettings(streamerUserId, streamerUserId, chatSettings);

        return true;
    } catch (error) {
        logger.error("Error setting emote-only mode", error);
    }

    return false;
};

/**
 * Turns follower-only mode on or off in the streamer's chat.
 * 
 * @param enable `true` will enable follower-only mode. `false` will disable follower-only mode. Defaults to `true`.
 * @param duration Duration in minutes that a user must be following the channel before they're allowed to chat. Default is `0`.
 * @returns `true` if the update succeeded or `false` if it failed
 */
export async function setFollowerOnlyMode(enable: boolean = true, duration: number = 0) {
    const client: ApiClient = twitchApi.getClient();
    const streamerUserId: number = accountAccess.getAccounts().streamer.userId;

    try {
        const chatSettings: HelixUpdateChatSettingsParams = {
            followerOnlyModeEnabled: enable,
            followerOnlyModeDelay: duration
        };

        await client.chat.updateSettings(streamerUserId, streamerUserId, chatSettings);

        return true;
    } catch (error) {
        logger.error("Error setting follower-only mode", error);
    }

    return false;
};

/**
 * Turns subscriber-only mode on or off in the streamer's chat.
 * 
 * @param enable `true` will enable subscriber-only mode. `false` will disable subscriber-only mode. Defaults to `true`.
 * @returns `true` if the update succeeded or `false` if it failed
 */
export async function setSubscriberOnlyMode(enable: boolean = true) {
    const client: ApiClient = twitchApi.getClient();
    const streamerUserId: number = accountAccess.getAccounts().streamer.userId;

    try {
        const chatSettings: HelixUpdateChatSettingsParams = {
            subscriberOnlyModeEnabled: enable
        };

        await client.chat.updateSettings(streamerUserId, streamerUserId, chatSettings);

        return true;
    } catch (error) {
        logger.error("Error setting subscriber-only mode", error);
    }

    return false;
};

/**
 * Turns slow mode on or off in the streamer's chat.
 * 
 * @param enable `true` will enable slow mode. `false` will disable slow mode. Defaults to `true`.
 * @param duration Duration in seconds that a user must wait between sending messages. Default is `5`.
 * @returns `true` if the update succeeded or `false` if it failed
 */
export async function setSlowMode(enable: boolean = true, duration: number = 5) {
    const client: ApiClient = twitchApi.getClient();
    const streamerUserId: number = accountAccess.getAccounts().streamer.userId;

    try {
        const chatSettings: HelixUpdateChatSettingsParams = {
            slowModeEnabled: enable,
            slowModeDelay: enable === true ? duration : null
        };

        await client.chat.updateSettings(streamerUserId, streamerUserId, chatSettings);

        return true;
    } catch (error) {
        logger.error("Error setting slow mode", error);
    }

    return false;
};

/**
 * Turns unique mode on or off in the streamer's chat.
 * 
 * @param enable `true` will enable unique mode. `false` will disable unique mode. Defaults to `true`.
 * @returns `true` if the update succeeded or `false` if it failed
 */
export async function setUniqueMode(enable: boolean = true) {
    const client: ApiClient = twitchApi.getClient();
    const streamerUserId: number = accountAccess.getAccounts().streamer.userId;

    try {
        const chatSettings: HelixUpdateChatSettingsParams = {
            uniqueChatModeEnabled: enable
        };

        await client.chat.updateSettings(streamerUserId, streamerUserId, chatSettings);

        return true;
    } catch (error) {
        logger.error("Error setting unique mode", error);
    }

    return false;
};