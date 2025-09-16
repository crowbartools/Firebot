import logger from "../../logwrapper";
import { ApiClient, HelixClip, UserIdResolvable } from "@twurple/api";
import { randomInt } from "crypto";

export class TwitchClipsApi {
    private _streamerClient: ApiClient;
    private _botClient: ApiClient;

    constructor(streamerClient: ApiClient, botClient: ApiClient) {
        this._streamerClient = streamerClient;
        this._botClient = botClient;
    }

    /**
     * Gets a Twitch clip from the specified clip URL
     * @param url URL of the clip
     * @returns A {@link HelixClip} from the given URL, or `null` if it doesn't exist
     */
    async getClipFromClipUrl(url: string): Promise<HelixClip> {
        if (url == null) {
            logger.warn("No URL specified for getClipFromClipUrl");
            return null;
        }

        const clipId = url.split("/").pop();
        try {
            const clip = await this._streamerClient.clips.getClipById(clipId);

            if (clip == null) {
                logger.warn(`No Twitch clip found with clip ID ${clipId}`);
            }

            return clip;
        } catch (error) {
            logger.error(`Error while getting Twitch clip from clip ID ${clipId} or URL ${url}`, error);
        }

        return null;
    }

    /**
     * Gets a random clip for the given user ID
     * @param userId Twitch user ID
     * @param limit How many clips to retrieve for random pool. Default is `100`.
     * @param isFeatured `true` for only featured clips, `false` for only non-featured, or `undefined` for all
     * @param startDate The earliest {@link Date} to find clips for, or `undefined` for no lower limit
     * @param endDate The latest {@link Date} to find clips for, or `undefined` for no upper limit
     * @returns A random {@link HelixClip} from the user's channel, or `null` if the user doesn't exist or their channel has no clips
     */
    async getRandomClipForUserById(
        userId: UserIdResolvable,
        limit = 100,
        isFeatured?: boolean,
        startDate?: Date,
        endDate?: Date
    ): Promise<HelixClip> {
        try {
            const filter = {
                limit,
                isFeatured,
                startDate: startDate?.toISOString(),
                endDate: endDate?.toISOString()
            };

            const clips = await this._streamerClient.clips.getClipsForBroadcaster(userId, filter);

            if (clips?.data?.length > 0) {
                const index = randomInt(1, clips.data.length) - 1;
                return clips.data[index];
            }

            logger.warn(`Cannot get random clip for user ID ${userId}; user has no clips`);
        } catch (error) {
            logger.error(`Error while getting random clip for user ID ${userId}`, error);
        }

        return null;
    }

    /**
     * Gets a random clip for the given username
     * @param userId Twitch username
     * @param limit How many clips to retrieve for random pool. Default is `100`.
     * @param isFeatured `true` for only featured clips, `false` for only non-featured, or `undefined` for all
     * @param startDate The earliest {@link Date} to find clips for, or `undefined` for no lower limit
     * @param endDate The latest {@link Date} to find clips for, or `undefined` for no upper limit
     * @returns A random {@link HelixClip} from the user's channel, or `null` if the user doesn't exist or their channel has no clips
     */
    async getRandomClipForUserByName(
        username: string,
        limit = 100,
        isFeatured?: boolean,
        startDate?: Date,
        endDate?: Date
    ): Promise<HelixClip> {
        try {
            const user = await this._streamerClient.users.getUserByName(username);

            if (user) {
                return await this.getRandomClipForUserById(user.id, limit, isFeatured, startDate, endDate);
            }

            logger.warn(`Cannot get random clip for non-existent user ${username}`);
        } catch (error) {
            logger.error(`Error while getting random clip for user ${username}`, error);
        }

        return null;
    }
}