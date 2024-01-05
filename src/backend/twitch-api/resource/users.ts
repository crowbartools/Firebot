import accountAccess from "../../common/account-access";
import logger from "../../logwrapper";
import { ApiClient, HelixUser, UserIdResolvable } from "@twurple/api";

export class TwitchUsersApi {
    private _streamerClient: ApiClient;
    private _botClient: ApiClient;

    constructor(streamerClient: ApiClient, botClient: ApiClient) {
        this._streamerClient = streamerClient;
        this._botClient = botClient;
    }

    async getUserById(userId: string): Promise<HelixUser> {
        return await this._streamerClient.users.getUserById(userId);
    }

    async getUserByName(username: string): Promise<HelixUser> {
        return await this._streamerClient.users.getUserByName(username);
    }

    async getUsersByNames(usernames: string[]): Promise<HelixUser[]> {
        return await this._streamerClient.users.getUsersByNames(usernames);
    }

    async getFollowDateForUser(username: string): Promise<Date> {
        const streamerData = accountAccess.getAccounts().streamer;

        const userId = (await this.getUserByName(username)).id;

        const followData = await this._streamerClient.channels.getChannelFollowers(streamerData.userId, userId);

        if (followData?.data[0] == null) {
            return null;
        }

        return followData.data[0].followDate;
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
            const userFollowResponse = await this._streamerClient.channels.getChannelFollowers(channel.id, user.id);
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
            await this._streamerClient.users.createBlock(streamerId, userId, {
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
            await this._streamerClient.users.deleteBlock(streamerId, userId);
        } catch (error) {
            logger.error("Error unblocking user", error.message);
            return false;
        }

        return true;
    }
}