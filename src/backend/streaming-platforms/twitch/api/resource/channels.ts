import {
    CommercialLength,
    HelixAdSchedule,
    HelixChannel,
    HelixChannelUpdate,
    HelixUser,
    HelixUserRelation,
    HelixChannelFollower
} from "@twurple/api";
import { ApiResourceBase } from './api-resource-base';
import type { TwitchApi } from "../";
import frontendCommunicator from '../../../../common/frontend-communicator';

export class TwitchChannelsApi extends ApiResourceBase {
    constructor(apiBase: typeof TwitchApi) {
        super(apiBase);
    }

    /**
     * Get channel info (game, title, etc) for the given broadcaster user id
     *
     * @param broadcasterId The id of the broadcaster to get channel info for. Defaults to Streamer channel if left blank.
     */
    async getChannelInformation(broadcasterId?: string): Promise<HelixChannel> {
        // default to streamer id
        if (broadcasterId == null || broadcasterId === "") {
            broadcasterId = this.accounts.streamer.userId;
        }

        try {
            const response = await this.streamerClient.channels.getChannelInfoById(broadcasterId);
            return response;
        } catch (error) {
            this.logger.error(`Failed to get Twitch channel info; ${(error as Error).message}`);
            return null;
        }
    }

    /**
     * Check whether a streamer is currently live.
     *
     * @param userId
     */
    async getOnlineStatus(userId: string): Promise<boolean> {
        if (this.streamerClient == null) {
            return false;
        }

        try {
            const stream = await this.streamerClient.streams.getStreamByUserId(userId);
            if (stream != null) {
                return true;
            }
        } catch (error) {
            this.logger.error(`Error while trying to get streamer's broadcast: ${(error as Error).message}`);
        }

        return false;
    }

    /**
     * Update the information of a Twitch channel.
     *
     * @param data
     */
    async updateChannelInformation(data: HelixChannelUpdate): Promise<void> {
        await this.streamerClient.channels.updateChannelInfo(this.accounts.streamer.userId, data);
    }

    /**
     * Get channel info (game, title, etc) for the given username
     *
     * @param username The id of the broadcaster to get channel info for.
     */
    async getChannelInformationByUsername(username: string): Promise<HelixChannel> {
        if (username == null) {
            return null;
        }

        let user: HelixUser;
        try {
            user = await this.streamerClient.users.getUserByName(username);
        } catch (error) {
            this.logger.error(`Error getting Twitch user with username ${username}: ${(error as Error).message}`);
        }

        if (user == null) {
            return null;
        }

        return this.getChannelInformation(user.id);
    }

    /**
     * Retrieves the current ad schedule for the streamer's channel.
     */
    async getAdSchedule(): Promise<HelixAdSchedule> {
        try {
            let adSchedule: HelixAdSchedule = null;
            const streamer = this.accounts.streamer;

            const isOnline = await this.getOnlineStatus(streamer.userId);
            if (isOnline && streamer.broadcasterType !== "") {
                adSchedule = await this.streamerClient.channels.getAdSchedule(streamer.userId);
            } else {
                this.logger.warn(`Unable to get ad schedule. ${isOnline !== true ? "Stream is offline." : "Streamer must be affiliate or partner."}`);
            }

            return adSchedule;
        } catch (error) {
            this.logger.error(`There was an error getting the ad schedule: ${(error as Error).message}`);
            return null;
        }
    }

    /**
     * Trigger a Twitch ad break. Default length 30 seconds.
     *
     * @param adLength How long the ad should run.
     */
    async triggerAdBreak(adLength = 30): Promise<boolean> {
        try {
            const streamer = this.accounts.streamer;

            const isOnline = await this.getOnlineStatus(streamer.userId);
            if (isOnline && streamer.broadcasterType !== "") {
                await this.streamerClient.channels.startChannelCommercial(streamer.userId, adLength as CommercialLength);
            }

            this.logger.debug(`A commercial was run. Length: ${adLength}. Twitch does not send confirmation, so we can't be sure it ran.`);
            return true;
        } catch (error) {
            /** @ts-ignore */
            frontendCommunicator.send("error", `Failed to trigger ad-break because: ${(error as Error).message}`);
            return false;
        }
    }

    /**
     * Snoozes the next scheduled mid-roll ad break by 5 minutes.
     */
    async snoozeAdBreak(): Promise<boolean> {
        try {
            const streamer = this.accounts.streamer;

            const isOnline = await this.getOnlineStatus(streamer.userId);
            if (isOnline && streamer.broadcasterType !== "") {
                const result = await this.streamerClient.channels.snoozeNextAd(streamer.userId);
                this.logger.debug(`Ads were snoozed. ${result.snoozeCount} snooze${result.snoozeCount !== 1 ? "s" : ""} remaining. Next scheduled ad break: ${result.nextAdDate.toLocaleTimeString()}`);
            } else {
                this.logger.warn(`Unable to snooze ads. ${isOnline !== true ? "Stream is offline." : "Streamer must be affiliate or partner."}`);
            }

            return true;
        } catch (error) {
            this.logger.error(`Failed to snooze ads: ${(error as Error).message}`);
            return false;
        }
    }

    /**
     * Starts a raid
     *
     * @param targetUserId The Twitch user ID whose channel to raid
     */
    async raidChannel(targetUserId: string): Promise<boolean> {
        try {
            const streamerId = this.accounts.streamer.userId;

            await this.streamerClient.raids.startRaid(streamerId, targetUserId);

            return true;
        } catch (error) {
            this.logger.error(`Unable to start raid: ${(error as Error).message}`);
        }

        return false;
    }

    /**
     * Cancels a raid
     */
    async cancelRaid(): Promise<boolean> {
        try {
            const streamerId = this.accounts.streamer.userId;

            await this.streamerClient.raids.cancelRaid(streamerId);

            return true;
        } catch (error) {
            this.logger.error(`Unable to cancel raid: ${(error as Error).message}`);
        }

        return false;
    }

    /**
     * Gets all the VIPs in the streamer's channel
     */
    async getVips(): Promise<HelixUserRelation[]> {
        const vips: HelixUserRelation[] = [];
        const streamerId = this.accounts.streamer?.userId;

        try {
            if (streamerId == null) {
                this.logger.warn("Unable to get channel VIP list. Streamer is not logged in.");
                return vips;
            }

            vips.push(...await this.streamerClient.channels.getVipsPaginated(streamerId).getAll());
        } catch (error) {
            this.logger.error(`Error getting VIPs: ${(error as Error).message}`);
        }

        return vips;
    }

    /**
     * Gets an optionally specified amount of followers of the streamer's channel.
     * 
     * @param amount The amount of followers that need to be retrieved. When omitted, retrieves all followers.
     */
    async getFollowers(amount?: number): Promise<HelixChannelFollower[]> {
        const followers: HelixChannelFollower[] = [];
        const streamerId = this.accounts.streamer?.userId;

        try {
            if (streamerId == null) {
                this.logger.warn("Unable to get channel follower list. Streamer is not logged in.");
                return followers;
            }

            if (amount == null) {
                followers.push(...await this.streamerClient.channels.getChannelFollowersPaginated(streamerId).getAll());
            } else if (amount > 0 && amount <= 100) {
                followers.push(...(await this.streamerClient.channels.getChannelFollowers(streamerId, null, { limit: amount })).data);
            } else {
                const loopCount = Math.ceil(amount / 100);
                let cursor = "";

                for (let i = 1; i < loopCount; i++) {
                    const response = await this.streamerClient.channels.getChannelFollowers(
                        streamerId, 
                        null, 
                        { 
                            limit: 100, 
                            after: cursor 
                        }
                    );
                    
                    followers.push(...response.data);
                    cursor = response.cursor;
                }

                const remainder = amount % 100;
                followers.push(...(await this.streamerClient.channels.getChannelFollowers(
                    streamerId, 
                    null, 
                    { 
                        limit: remainder, 
                        after: cursor 
                    }
                )).data);
            }
        } catch (error) {
            this.logger.error(`Error getting followers: ${(error as Error).message}`);
        }

        return followers;
    }
}