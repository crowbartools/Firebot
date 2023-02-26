import accountAccess from "../../common/account-access";
import logger from '../../logwrapper';
import { TwitchUsersApi } from "./users";
import { ApiClient, CommercialLength, HelixChannel, HelixChannelUpdate, HelixUser } from "@twurple/api";

export class TwitchChannelsApi {
    client: ApiClient;

    constructor(apiClient: ApiClient) {
        this.client = apiClient;
    }

    /**
     * Get channel info (game, title, etc) for the given broadcaster user id
     * 
     * @param broadcasterId The id of the broadcaster to get channel info for. Defaults to Streamer channel if left blank.
     */
    async getChannelInformation(broadcasterId: string): Promise<HelixChannel> {
        // default to streamer id
        if (broadcasterId == null || broadcasterId === "") {
            broadcasterId = accountAccess.getAccounts().streamer.userId;
        }

        try {
            const response = await this.client.channels.getChannelInfoById(broadcasterId);
            return response;
        } catch (error) {
            logger.error("Failed to get twitch channel info", error);
            return null;
        }
    }
    
    /**
     * Check whether a streamer is currently live.
     * 
     * @param userId
     */
    async getOnlineStatus(userId: string): Promise<boolean> {
        if (this.client == null) {
            return false;
        }
    
        try {
            const stream = await this.client.streams.getStreamByUserId(userId);
            if (stream != null) {
                return true;
            }
        } catch (error) {
            logger.error("Error while trying to get streamers broadcast", error);
        }
    
        return false;
    }
    
    /**
     * Update the information of a Twitch channel.
     * 
     * @param data
     */
    async updateChannelInformation(data: HelixChannelUpdate): Promise<void> {
        await this.client.channels.updateChannelInfo(accountAccess.getAccounts().streamer.userId, data);
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
            user = await new TwitchUsersApi(this.client).getUserByName(username);
        } catch (error) {
            logger.error(`Error getting user with username ${username}`, error);
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
    async triggerAdBreak(adLength: number = 30): Promise<boolean> {
        try {
            const streamer = accountAccess.getAccounts().streamer;
    
            const isOnline = await this.getOnlineStatus(streamer.userId);
            if (isOnline && streamer.broadcasterType !== "") {
                await this.client.channels.startChannelCommercial(streamer.userId, adLength as CommercialLength);
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
    
            await this.client.raids.startRaid(streamerId, targetUserId);
    
            return true;
        } catch (error) {
            logger.error("Unable to start raid", error);
        }
    
        return false;
    }
    
    /**
     * Cancels a raid
     */
    async cancelRaid(): Promise<boolean> {
        try {
            const streamerId = accountAccess.getAccounts().streamer.userId;
    
            await this.client.raids.cancelRaid(streamerId);
    
            return true;
        } catch (error) {
            logger.error("Unable to cancel raid", error);
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
            let result = await this.client.channels.getVips(streamerId);
            vips.push(...result.data.map(c => c.displayName));
    
            while (result.cursor) {
                result = await this.client.channels.getVips(streamerId, { after: result.cursor });
                vips.push(...result.data.map(c => c.displayName));
            }
        } catch (error) {
            logger.error("Error getting VIPs", error);
        }
    
        return vips;
    }
};