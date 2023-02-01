import twitchApi from "../api";
import accountAccess from "../../common/account-access";
import logger from '../../logwrapper';
import { CommercialLength, HelixChannel, HelixChannelUpdate, HelixUser } from "@twurple/api";

/**
 * Get channel info (game, title, etc) for the given broadcaster user id
 * 
 * @param broadcasterId The id of the broadcaster to get channel info for. Defaults to Streamer channel if left blank.
 */
export async function getChannelInformation(broadcasterId: string): Promise<HelixChannel> {
    // default to streamer id
    if (broadcasterId == null || broadcasterId === "") {
        broadcasterId = accountAccess.getAccounts().streamer.userId.toString();
    }

    const client = twitchApi.getClient();
    try {
        const response = await client.channels.getChannelInfoById(broadcasterId);
        return response;
    } catch (error) {
        logger.error("Failed to get twitch channel info", error);
        return null;
    }
};

/**
 * Check whether a streamer is currently live.
 * 
 * @param username
 */
export async function getOnlineStatus(username: string): Promise<boolean> {
    const client = twitchApi.getClient();
    if (client == null) {
        return false;
    }

    try {
        const stream = await client.streams.getStreamByUserName(username);
        if (stream != null) {
            return true;
        }
    } catch (error) {
        logger.error("Error while trying to get streamers broadcast", error);
    }

    return false;
};

/**
 * Update the information of a Twitch channel.
 * 
 * @param data
 */
export async function updateChannelInformation(data: HelixChannelUpdate): Promise<void> {
    const client = twitchApi.getClient();
    await client.channels.updateChannelInfo(accountAccess.getAccounts().streamer.userId, data);
};

/**
 * Get channel info (game, title, etc) for the given username
 * 
 * @param username The id of the broadcaster to get channel info for.
 */
export async function getChannelInformationByUsername(username: string): Promise<HelixChannel> {
    if (username == null) {
        return null;
    }

    const client = twitchApi.getClient();
    let user: HelixUser;
    try {
        user = await client.users.getUserByName(username);
    } catch (error) {
        logger.error(`Error getting user with username ${username}`, error);
    }

    if (user == null) {
        return null;
    }

    return getChannelInformation(user.id);
};

/**
 * Trigger a Twitch ad break. Default length 30 seconds.
 * 
 * @param adLength How long the ad should run.
 */
export async function triggerAdBreak(adLength: number = 30): Promise<boolean> {
    try {
        const client = twitchApi.getClient();
        const streamer = accountAccess.getAccounts().streamer;

        const isOnline = await getOnlineStatus(streamer.username);
        if (isOnline && streamer.broadcasterType !== "") {
            await client.channels.startChannelCommercial(streamer.userId, adLength as CommercialLength);
        }

        logger.debug(`A commercial was run. Length: ${adLength}. Twitch does not send confirmation, so we can't be sure it ran.`);
        return true;
    } catch (error) {
        /** @ts-ignore */
        renderWindow.webContents.send("error", `Failed to trigger ad-break because: ${error.message}`);
        return false;
    }
};

/**
 * Starts a raid
 *
 * @param targetUserId The Twitch user ID whose channel to raid
 */
export async function raidChannel(targetUserId: string): Promise<boolean> {
    try {
        const client = twitchApi.getClient();
        const streamerId = accountAccess.getAccounts().streamer.userId;

        await client.raids.startRaid(streamerId, targetUserId);

        return true;
    } catch (error) {
        logger.error("Unable to start raid", error);
    }

    return false;
};

/**
 * Cancels a raid
 */
export async function cancelRaid(): Promise<boolean> {
    try {
        const client = twitchApi.getClient();
        const streamerId = accountAccess.getAccounts().streamer.userId;

        await client.raids.cancelRaid(streamerId);

        return true;
    } catch (error) {
        logger.error("Unable to cancel raid", error);
    }

    return false;
};