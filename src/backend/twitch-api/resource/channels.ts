import logger from '../../logwrapper';
import accountAccess from "../../common/account-access";
import { ApiClient, CommercialLength, HelixChannel, HelixChannelUpdate, HelixUser } from "@twurple/api";

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
            renderWindow.webContents.send("error", `Failed to trigger ad-break because: ${error.message}`);
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
    async getVips(): Promise<string[]> {
        const vips: string[] = [];
        const streamerId = accountAccess.getAccounts().streamer.userId;

        try {
            let result = await this._streamerClient.channels.getVips(streamerId);
            vips.push(...result.data.map(c => c.displayName));

            while (result.cursor) {
                result = await this._streamerClient.channels.getVips(streamerId, { after: result.cursor });
                vips.push(...result.data.map(c => c.displayName));
            }
        } catch (error) {
            logger.error("Error getting VIPs", error.message);
        }

        return vips;
    }
}