import logger from '../../logwrapper';
import accountAccess from "../../common/account-access";
import { ApiClient, CommercialLength, HelixChannel, HelixChannelUpdate, HelixUser, HelixUserRelation } from "@twurple/api";
import { HelixAdSchedule } from '@twurple/api/lib/endpoints/channel/HelixAdSchedule';
import frontendCommunicator from '../../common/frontend-communicator';

export class TwitchChannelsApi {
    private _streamerClient: ApiClient;
    private _botClient: ApiClient;

    constructor(streamerClient: ApiClient, botClient: ApiClient) {
        this._streamerClient = streamerClient;
        this._botClient = botClient;
    }

    /**
     * Get channel info (game, title, etc) for the given broadcaster user id
     *
     * @param broadcasterId The id of the broadcaster to get channel info for. Defaults to Streamer channel if left blank.
     */
    async getChannelInformation(broadcasterId?: string): Promise<HelixChannel> {
        // default to streamer id
        if (broadcasterId == null || broadcasterId === "") {
            broadcasterId = accountAccess.getAccounts().streamer.userId;
        }

        try {
            const response = await this._streamerClient.channels.getChannelInfoById(broadcasterId);
            return response;
        } catch (error) {
            logger.error("Failed to get twitch channel info", error.message);
            return null;
        }
    }

    /**
     * Check whether a streamer is currently live.
     *
     * @param userId
     */
    async getOnlineStatus(userId: string): Promise<boolean> {
        if (this._streamerClient == null) {
            return false;
        }

        try {
            const stream = await this._streamerClient.streams.getStreamByUserId(userId);
            if (stream != null) {
                return true;
            }
        } catch (error) {
            logger.error("Error while trying to get streamers broadcast", error.message);
        }

        return false;
    }

    /**
     * Update the information of a Twitch channel.
     *
     * @param data
     */
    async updateChannelInformation(data: HelixChannelUpdate): Promise<void> {
        await this._streamerClient.channels.updateChannelInfo(accountAccess.getAccounts().streamer.userId, data);
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
            user = await this._streamerClient.users.getUserByName(username);
        } catch (error) {
            logger.error(`Error getting user with username ${username}`, error.message);
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
            const streamer = accountAccess.getAccounts().streamer;

            const isOnline = await this.getOnlineStatus(streamer.userId);
            if (isOnline && streamer.broadcasterType !== "") {
                adSchedule = await this._streamerClient.channels.getAdSchedule(streamer.userId);
            } else {
                logger.warn(`Unable to get ad schedule. ${isOnline !== true ? "Stream is offline." : "Streamer must be affiliate or partner."}`);
            }

            return adSchedule;
        } catch (error) {
            logger.error("There was an error getting the ad schedule", error.message);
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
            const streamer = accountAccess.getAccounts().streamer;

            const isOnline = await this.getOnlineStatus(streamer.userId);
            if (isOnline && streamer.broadcasterType !== "") {
                await this._streamerClient.channels.startChannelCommercial(streamer.userId, adLength as CommercialLength);
            }

            logger.debug(`A commercial was run. Length: ${adLength}. Twitch does not send confirmation, so we can't be sure it ran.`);
            return true;
        } catch (error) {
            /** @ts-ignore */
            frontendCommunicator.send("error", `Failed to trigger ad-break because: ${error.message}`);
            return false;
        }
    }

    /**
     * Snoozes the next scheduled mid-roll ad break by 5 minutes.
     */
    async snoozeAdBreak(): Promise<boolean> {
        try {
            const streamer = accountAccess.getAccounts().streamer;

            const isOnline = await this.getOnlineStatus(streamer.userId);
            if (isOnline && streamer.broadcasterType !== "") {
                const result = await this._streamerClient.channels.snoozeNextAd(streamer.userId);
                logger.debug(`Ads were snoozed. ${result.snoozeCount} snooze${result.snoozeCount !== 1 ? "s" : ""} remaining. Next scheduled ad break: ${result.nextAdDate.toLocaleTimeString()}`);
            } else {
                logger.warn(`Unable to snooze ads. ${isOnline !== true ? "Stream is offline." : "Streamer must be affiliate or partner."}`);
            }

            return true;
        } catch (error) {
            logger.error("Failed to snooze ads", error.message);
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
            const streamerId = accountAccess.getAccounts().streamer.userId;

            await this._streamerClient.raids.startRaid(streamerId, targetUserId);

            return true;
        } catch (error) {
            logger.error("Unable to start raid", error.message);
        }

        return false;
    }

    /**
     * Cancels a raid
     */
    async cancelRaid(): Promise<boolean> {
        try {
            const streamerId = accountAccess.getAccounts().streamer.userId;

            await this._streamerClient.raids.cancelRaid(streamerId);

            return true;
        } catch (error) {
            logger.error("Unable to cancel raid", error.message);
        }

        return false;
    }

    /**
     * Gets all the VIPs in the streamer's channel
     */
    async getVips(): Promise<HelixUserRelation[]> {
        const vips: HelixUserRelation[] = [];
        const streamerId = accountAccess.getAccounts().streamer?.userId;

        try {
            if (streamerId == null) {
                logger.warn("Unable to get channel VIP list. Streamer is not logged in.");
                return vips;
            }

            vips.push(...await this._streamerClient.channels.getVipsPaginated(streamerId).getAll());
        } catch (error) {
            logger.error("Error getting VIPs", error.message);
        }

        return vips;
    }
}