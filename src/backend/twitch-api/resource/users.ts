import accountAccess from "../../common/account-access";
import logger from "../../logwrapper";
import { ApiClient, UserIdResolvable } from "@twurple/api";

export class TwitchUsersApi {
    client: ApiClient;

    constructor(apiClient: ApiClient) {
        this.client = apiClient;
    }

    async getFollowDateForUser(username: string): Promise<Date> {
        const streamerData = accountAccess.getAccounts().streamer;
    
        const userId = (await this.client.users.getUserByName(username)).id;
    
        const followData = await this.client.users.getFollowFromUserToBroadcaster(userId, streamerData.userId);
    
        if (followData == null) {
            return null;
        }
    
        return followData.followDate;
    }

    async doesUserFollowChannel(username: string, channelName: string): Promise<boolean> {
        if (username == null || channelName == null) {
            return false;
        }
    
        if (username.toLowerCase() === channelName.toLowerCase()) {
            return true;
        }
    
        const [user, channel] = await this.client.users.getUsersByNames([username, channelName]);
    
        if (user.id == null || channel.id == null) {
            return false;
        }
    
        const userFollow = await this.client.users.userFollowsBroadcaster(user.id, channel.id);
    
        return userFollow ?? false;
    }

    async blockUser(userId: UserIdResolvable, reason?: 'spam' | 'harassment' | 'other'): Promise<boolean> {
        if (userId == null) {
            return false;
        }

        const streamerId = accountAccess.getAccounts().streamer.userId;
    
        try {
            await this.client.users.createBlock(streamerId, userId, {
                reason
            });
        } catch (error) {
            logger.error("Error blocking user", error);
            return false;
        }
    
        return true;
    }
};