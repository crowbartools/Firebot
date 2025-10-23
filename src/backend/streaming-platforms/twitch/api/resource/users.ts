import {
    HelixChannelFollower,
    HelixUser,
    UserIdResolvable
} from "@twurple/api";
import { ApiResourceBase } from "./api-resource-base";
import type { TwitchApi } from "../";

export class TwitchUsersApi extends ApiResourceBase {
    constructor(apiBase: typeof TwitchApi) {
        super(apiBase);
    }

    async getUserById(userId: string): Promise<HelixUser> {
        return await this.streamerClient.users.getUserById(userId);
    }

    async getUsersByIds(userIds: string[]): Promise<HelixUser[]> {
        const users: HelixUser[] = [];
        for (let x = 0; x < userIds.length; x += 100) {
            const userBatch = userIds.slice(x, x + 100);
            try {
                users.push(...await this.streamerClient.users.getUsersByIds(userBatch));
            } catch (error) {
                this.logger.error(`Error trying to get users by ID from Twitch API`, error);
            }
        }
        return users;
    }

    async getUserByName(username: string): Promise<HelixUser> {
        return await this.streamerClient.users.getUserByName(username);
    }

    async getUsersByNames(usernames: string[]): Promise<HelixUser[]> {
        const users: HelixUser[] = [];
        for (let x = 0; x < usernames.length; x += 100) {
            const userBatch = usernames.slice(x, x + 100);
            try {
                users.push(...await this.streamerClient.users.getUsersByNames(userBatch));
            } catch (error) {
                this.logger.error(`Error trying to get users by name from Twitch API`, error);
            }
        }
        return users;
    }

    async getFollowDateForUser(username: string): Promise<Date> {
        const streamerData = this.accounts.streamer;

        const userId = (await this.getUserByName(username)).id;

        const followData = await this.streamerClient.channels.getChannelFollowers(streamerData.userId, userId);

        if (followData?.data[0] == null) {
            return null;
        }

        return followData.data[0].followDate;
    }

    /**
     * @param username
     * @param channelName
     * @returns {Promise<HelixChannelFollower | boolean>} true when username === channelName, false when not following
     */
    async getUserChannelFollow(username: string, channelName: string): Promise<HelixChannelFollower | boolean> {
        if (username == null || channelName == null) {
            return false;
        }

        if (username.toLowerCase() === channelName.toLowerCase()) {
            return true;
        }

        const [user, channel] = await this.getUsersByNames([username, channelName]);

        if (user?.id == null || channel?.id == null) {
            return false;
        }

        try {
            const userFollowResponse = await this.streamerClient.channels.getChannelFollowers(channel.id, user.id);
            return userFollowResponse?.data?.[0];
        } catch (err) {
            this.logger.error(`Failed to check if ${username} follows ${channelName}: ${(err as Error).message}`);
            return false;
        }
    }

    async doesUserFollowChannel(username: string, channelName: string): Promise<boolean> {
        return await this.getUserChannelFollow(username, channelName) !== false;
    }

    async blockUser(userId: UserIdResolvable, reason?: 'spam' | 'harassment' | 'other'): Promise<boolean> {
        if (userId == null) {
            return false;
        }

        const streamerId = this.accounts.streamer.userId;

        try {
            await this.streamerClient.users.createBlock(streamerId, userId, {
                reason
            });
        } catch (error) {
            this.logger.error(`Error blocking user: ${(error as Error).message}`);
            return false;
        }

        return true;
    }

    async unblockUser(userId: UserIdResolvable): Promise<boolean> {
        if (userId == null) {
            return false;
        }

        const streamerId = this.accounts.streamer.userId;

        try {
            await this.streamerClient.users.deleteBlock(streamerId, userId);
        } catch (error) {
            this.logger.error(`Error unblocking user: ${(error as Error).message}`);
            return false;
        }

        return true;
    }
}