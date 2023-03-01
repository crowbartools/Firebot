import accountAccess from "../../common/account-access";
import logger from "../../logwrapper";
import { ApiClient, HelixUser, UserIdResolvable } from "@twurple/api";

export class TwitchUsersApi {
    streamerClient: ApiClient;
    botClient: ApiClient;

    constructor(streamerClient: ApiClient, botClient: ApiClient) {
        this.streamerClient = streamerClient;
        this.botClient = botClient;
    }

    async getUserById(userId: string): Promise<HelixUser> {
        return await this.streamerClient.users.getUserById(userId);
    }

    async getUserByName(username: string): Promise<HelixUser> {
        return await this.streamerClient.users.getUserByName(username);
    }

    async getUsersByNames(usernames: string[]): Promise<HelixUser[]> {
        return await this.streamerClient.users.getUsersByNames(usernames);
    }

    async getFollowDateForUser(username: string): Promise<Date> {
        const streamerData = accountAccess.getAccounts().streamer;
    
        const userId = (await this.getUserByName(username)).id;
    
        const followData = await this.streamerClient.channels.getChannelFollowers(streamerData.userId, streamerData.userId, userId);
    
        if (followData?.data[0] == null) {
            return null;
        }
    
        return followData.data[0].followDate;
    }

    /**
     * @deprecated This MUST be removed before August because #JustTwitchThings
     */
    async doesUserFollowChannelLegacy(username: string, channelName: string): Promise<boolean> {
        if (username == null || channelName == null) {
            return false;
        }
    
        if (username.toLowerCase() === channelName.toLowerCase()) {
            return true;
        }
    
        const [user, channel] = await this.getUsersByNames([username, channelName]);
    
        if (user.id == null || channel.id == null) {
            return false;
        }
    
        const userFollow = await this.streamerClient.users.userFollowsBroadcaster(user.id, channel.id);
    
        return userFollow ?? false;
    }

    async doesUserFollowChannel(username: string, channelName: string): Promise<boolean> {
        if (username == null || channelName == null) {
            return false;
        }

        if (username.toLowerCase() === channelName.toLowerCase()) {
            return true;
        }

        const streamerData = accountAccess.getAccounts().streamer;

        const [user, channel] = await this.getUsersByNames([username, channelName]);

        if (user.id == null || channel.id == null) {
            return false;
        }

        try {
            const userFollowResponse = await this.streamerClient.channels.getChannelFollowers(channel.id, streamerData.userId, user.id);
            const userFollow = userFollowResponse?.data?.length === 1;
    
            return userFollow ?? false;
        } catch (err) {
            logger.error(`Failed to check if ${username} follows ${channelName}`, err.message);
            return false;
        }
    }

    async blockUser(userId: UserIdResolvable, reason?: 'spam' | 'harassment' | 'other'): Promise<boolean> {
        if (userId == null) {
            return false;
        }

        const streamerId = accountAccess.getAccounts().streamer.userId;
    
        try {
            await this.streamerClient.users.createBlock(streamerId, userId, {
                reason
            });
        } catch (error) {
            logger.error("Error blocking user", error.message);
            return false;
        }
    
        return true;
    }

    async unblockUser(userId: UserIdResolvable): Promise<boolean> {
        if (userId == null) {
            return false;
        }

        const streamerId = accountAccess.getAccounts().streamer.userId;
    
        try {
            await this.streamerClient.users.deleteBlock(streamerId, userId);
        } catch (error) {
            logger.error("Error unblocking user", error.message);
            return false;
        }
    
        return true;
    }
};