import {
    type HelixBanUserRequest,
    type HelixBan,
    type HelixModerator,
    type UserIdResolvable,
    extractUserId
} from "@twurple/api";
import type { BasicViewer } from '../../../../../types/viewers';
import { ApiResourceBase } from './api-resource-base';
import type { TwitchApi } from "../";
import frontendCommunicator from '../../../../common/frontend-communicator';

interface UserModRequest {
    username: string;
    shouldBeMod: boolean;
}

interface UserBanRequest {
    username: string;
    shouldBeBanned: boolean;
}

interface UserVipRequest {
    username: string;
    shouldBeVip: boolean;
}

type ModerationEvents = {
    "vip:added": (user: BasicViewer) => void;
    "vip:removed": (userId: string) => void;
    "moderator:added": (user: BasicViewer) => void;
    "moderator:removed": (userId: string) => void;
};

export class TwitchModerationApi extends ApiResourceBase<ModerationEvents> {
    constructor(apiBase: typeof TwitchApi) {
        super(apiBase);

        frontendCommunicator.onAsync("update-user-banned-status", async (data: UserBanRequest) => {
            if (data == null) {
                return;
            }

            const { username, shouldBeBanned } = data;
            if (username == null || shouldBeBanned == null) {
                return;
            }

            const user = await this.streamerClient.users.getUserByName(username);
            if (user == null) {
                return;
            }

            if (shouldBeBanned) {
                await this.banUser(user.id, "Banned via Firebot");
            } else {
                await this.unbanUser(user.id);
            }
        });

        frontendCommunicator.onAsync("update-user-mod-status", async (data: UserModRequest) => {
            if (data == null) {
                return;
            }

            const { username, shouldBeMod } = data;
            if (username == null || shouldBeMod == null) {
                return;
            }

            const user = await this.streamerClient.users.getUserByName(username);
            if (user == null) {
                return;
            }

            if (shouldBeMod) {
                await this.addChannelModerator(user.id);
            } else {
                await this.removeChannelModerator(user.id);
            }
        });

        frontendCommunicator.onAsync("update-user-vip-status", async (data: UserVipRequest) => {
            if (data == null) {
                return;
            }

            const { username, shouldBeVip } = data;
            if (username == null || shouldBeVip == null) {
                return;
            }

            const user = await this.streamerClient.users.getUserByName(username);
            if (user == null) {
                return;
            }

            if (shouldBeVip) {
                await this.addChannelVip(user.id);
            } else {
                await this.removeChannelVip(user.id);
            }
        });
    }

    /**
     * Determines if a user is timed out in the streamer's channel
     *
     * @param userId The user ID to check if they're timed out
     * @returns `true` if the user is timed out, or `false` if they're either banned indefinitely or not timed out
     */
    async isUserTimedOut(userId: UserIdResolvable): Promise<boolean> {
        const streamerId = this.accounts.streamer.userId;

        try {
            userId = extractUserId(userId);
            const response = await this.streamerClient.moderation.getBannedUsers(streamerId, {
                userId: [userId]
            });

            return response.data.some(b => b.userId === userId && b.expiryDate != null);
        } catch (error) {
            this.logger.error(`Error checking if user ${extractUserId(userId)} is timed out: ${(error as Error).message}`);
            return null;
        }
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
        const streamerId = this.accounts.streamer.userId;

        try {
            const timeoutRequest: HelixBanUserRequest = {
                user: userId,
                duration: duration,
                reason: reason
            };

            const response = await this.moderationClient.moderation.banUser(streamerId, timeoutRequest);

            return !!response;
        } catch (error) {
            this.logger.error("Error timing out user", (error as Error).message);
        }

        return false;
    }

    /**
     * Gets all banned users from a streamer's channel.
     *
     * @returns {HelixBan[]}
     */
    async getBannedUsers(): Promise<HelixBan[]> {
        const streamerId = this.accounts.streamer.userId;

        try {
            const response = await this.streamerClient.moderation.getBannedUsersPaginated(streamerId).getAll();

            return response;
        } catch (error) {
            this.logger.error(`Error getting list of banned users for channel: ${(error as Error).message}`);
            return null;
        }
    }

    /**
     * Determines if a user is banned (not timed out) in the streamer's channel
     *
     * @param userId The user ID to check if they're banned
     * @returns `true` if the user is banned, or `false` if they're either not banned or only timed out
     */
    async isUserBanned(userId: UserIdResolvable): Promise<boolean> {
        const streamerId = this.accounts.streamer.userId;

        try {
            userId = extractUserId(userId);
            const response = await this.streamerClient.moderation.getBannedUsers(streamerId, {
                userId: [userId]
            });

            return response.data.some(b => b.userId === userId && b.expiryDate == null);
        } catch (error) {
            this.logger.error(`Error checking if user ${extractUserId(userId)} is banned: ${(error as Error).message}`);
            return null;
        }
    }

    /**
     * Bans a user from the streamer's channel.
     *
     * @param userId The Twitch user ID of the user to ban
     * @param reason The reason for the ban
     * @returns `true` if the ban was successful or `false` if it failed
     */
    async banUser(userId: UserIdResolvable, reason: string = null): Promise<boolean> {
        const streamerId = this.accounts.streamer.userId;

        try {
            const banRequest: HelixBanUserRequest = {
                user: userId,
                duration: null,
                reason: reason
            };

            await this.moderationClient.moderation.banUser(streamerId, banRequest);

            return true;
        } catch (error) {
            this.logger.error("Error banning user", (error as Error).message);
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
        const streamerId = this.accounts.streamer.userId;

        try {
            await this.moderationClient.moderation.unbanUser(streamerId, userId);

            return true;
        } catch (error) {
            this.logger.error("Error unbanning/removing timeout for user", (error as Error).message);
        }

        return false;
    }

    /**
     * Gets all the moderators in the streamer's channel.
     */
    async getModerators(): Promise<HelixModerator[]> {
        const moderators: HelixModerator[] = [];
        const streamerId = this.accounts.streamer?.userId;

        try {
            if (streamerId == null) {
                this.logger.warn("Unable to get channel moderator list. Streamer is not logged in.");
                return moderators;
            }

            moderators.push(...await this.streamerClient.moderation.getModeratorsPaginated(streamerId).getAll());
        } catch (error) {
            this.logger.error("Error getting moderators", (error as Error).message);
        }

        return moderators;
    }

    /**
     * Adds a moderator to the streamer's channel.
     *
     * @param userId The Twitch user ID of the user to add as a mod
     * @returns `true` if the user was added as a mod successfully or `false` if it failed
     */
    async addChannelModerator(userId: UserIdResolvable): Promise<boolean> {
        const streamerId = this.accounts.streamer.userId;

        try {
            await this.streamerClient.moderation.addModerator(streamerId, userId);

            const user = await this.streamerClient.users.getUserById(userId);
            this.emit("moderator:added", {
                id: user.id,
                username: user.name,
                displayName: user.displayName
            });
            return true;
        } catch (error) {
            this.logger.error("Error adding moderator", (error as Error).message);
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
        const streamerId = this.accounts.streamer.userId;

        try {
            await this.streamerClient.moderation.removeModerator(streamerId, userId);
            this.emit("moderator:removed", userId as string);
            return true;
        } catch (error) {
            this.logger.error("Error removing moderator", (error as Error).message);
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
        const streamerId = this.accounts.streamer.userId;

        try {
            await this.streamerClient.channels.addVip(streamerId, userId);

            const user = await this.streamerClient.users.getUserById(userId);
            this.emit("vip:added", {
                id: user.id,
                username: user.name,
                displayName: user.displayName
            });
            return true;
        } catch (error) {
            this.logger.error("Error adding VIP", (error as Error).message);
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
        const streamerId = this.accounts.streamer.userId;

        try {
            await this.streamerClient.channels.removeVip(streamerId, userId);
            this.emit("vip:removed", userId as string);
            return true;
        } catch (error) {
            this.logger.error("Error removing VIP", (error as Error).message);
        }

        return false;
    }

    /**
     * Processes a message held by AutoMod.
     * @param messageId ID of the held message
     * @param allow `true` to allow the message, or `false` to deny it
     */
    async processHeldAutoModMessage(messageId: string, allow: boolean) {
        try {
            const streamerId = this.accounts.streamer.userId;
            await this.streamerClient.moderation.processHeldAutoModMessage(streamerId, messageId, allow);
        } catch (error) {
            // eslint-disable-next-line
            const likelyExpired = error?.body?.includes("attempted to update a message status that was either already set") === true;
            frontendCommunicator.send("twitch:chat:automod-update-error", { messageId, likelyExpired });
            this.logger.error(`Error processing held AutoMod message: ${(error as Error).message}`);
        }
    }
}