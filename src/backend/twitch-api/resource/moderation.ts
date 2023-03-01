import logger from '../../logwrapper';
import accountAccess from "../../common/account-access";
import { ApiClient, HelixBanUserRequest, UserIdResolvable } from "@twurple/api";

export class TwitchModerationApi {
    streamerClient: ApiClient;
    botClient: ApiClient;

    constructor(streamerClient: ApiClient, botClient: ApiClient) {
        this.streamerClient = streamerClient;
        this.botClient = botClient;
    }

    /**
     * Times out a user in the streamer's channel for a specified duration.
     * 
     * @param userId The Twitch user ID of the user to timeout
     * @param duration The duration in seconds to timeout the user
     * @param reason The reason for the timeout
     * @returns `true` if the timeout was successful or `false` if it failed
     */
    async timeoutUser(
        userId: UserIdResolvable,
        duration: number,
        reason: string = null
    ): Promise<boolean> {
        const streamerId = accountAccess.getAccounts().streamer.userId;
    
        try {
            const timeoutRequest: HelixBanUserRequest = {
                user: userId,
                duration: duration,
                reason: reason
            };
    
            const response = await this.streamerClient.moderation.banUser(streamerId, streamerId, timeoutRequest);
    
            return true;
        } catch (error) {
            logger.error("Error timing out user", error);
        }
    
        return false;
    }
    
    /**
     * Bans a user from the streamer's channel.
     * 
     * @param userId The Twitch user ID of the user to ban
     * @param reason The reason for the ban
     * @returns `true` if the ban was successful or `false` if it failed
     */
    async banUser(userId: UserIdResolvable, reason: string = null): Promise<boolean> {
        const streamerId = accountAccess.getAccounts().streamer.userId;
    
        try {
            const banRequest: HelixBanUserRequest = {
                user: userId,
                duration: null,
                reason: reason
            };
    
            await this.streamerClient.moderation.banUser(streamerId, streamerId, banRequest);
    
            return true;
        } catch (error) {
            logger.error("Error banning user", error);
        }
    
        return false;
    }
    
    /**
     * Unbans/removes the timeout for a user in the streamer's channel.
     * 
     * @param userId The Twitch user ID of the user to unban/remove from timeout
     * @returns `true` if the unban/removal from timeout was successful or `false` if it failed
     */
    async unbanUser(userId: UserIdResolvable): Promise<boolean> {
        const streamerId = accountAccess.getAccounts().streamer.userId;
    
        try {
            await this.streamerClient.moderation.unbanUser(streamerId, streamerId, userId);
    
            return true;
        } catch (error) {
            logger.error("Error unbanning/removing timeout for user", error);
        }
    
        return false;
    }
    
    /**
     * Adds a moderator to the streamer's channel.
     * 
     * @param userId The Twitch user ID of the user to add as a mod
     * @returns `true` if the user was added as a mod successfully or `false` if it failed
     */
    async addChannelModerator(userId: UserIdResolvable): Promise<boolean> {
        const streamerId = accountAccess.getAccounts().streamer.userId;
    
        try {
            await this.streamerClient.moderation.addModerator(streamerId, userId);
    
            return true;
        } catch (error) {
            logger.error("Error adding moderator", error);
        }
    
        return false;
    }
    
    /**
     * Removes a moderator from the streamer's channel.
     * 
     * @param userId The Twitch user ID of the user to remove as a mod
     * @returns `true` if the user was removed as a mod successfully or `false` if it failed
     */
    async removeChannelModerator(userId: UserIdResolvable): Promise<boolean> {
        const streamerId = accountAccess.getAccounts().streamer.userId;
    
        try {
            await this.streamerClient.moderation.removeModerator(streamerId, userId);
    
            return true;
        } catch (error) {
            logger.error("Error removing moderator", error);
        }
    
        return false;
    }
    
    /**
     * Adds a VIP to the streamer's channel.
     * 
     * @param userId The Twitch user ID of the user to add as a VUP
     * @returns `true` if the user was added as a VUP successfully or `false` if it failed
     */
    async addChannelVip(userId: UserIdResolvable): Promise<boolean> {
        const streamerId = accountAccess.getAccounts().streamer.userId;
    
        try {
            await this.streamerClient.channels.addVip(streamerId, userId);    
            return true;
        } catch (error) {
            logger.error("Error adding VIP", error);
        }
    
        return false;
    }
    
    /**
     * Removes a VIP from the streamer's channel.
     * 
     * @param userId The Twitch user ID of the user to remove as a VIP
     * @returns `true` if the user was removed as a VIP successfully or `false` if it failed
     */
    async removeChannelVip(userId: UserIdResolvable): Promise<boolean> {
        const streamerId = accountAccess.getAccounts().streamer.userId;
    
        try {
            await this.streamerClient.channels.removeVip(streamerId, userId);
            return true;
        } catch (error) {
            logger.error("Error removing VIP", error);
        }
    
        return false;
    }
};