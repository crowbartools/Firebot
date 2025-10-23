import { extractUserId, HelixClip, UserIdResolvable } from "@twurple/api";
import { randomInt } from "crypto";
import { ApiResourceBase } from "./api-resource-base";
import type { TwitchApi } from "../";
import { wait } from "../../../../utils";

export class TwitchClipsApi extends ApiResourceBase {
    constructor(apiBase: typeof TwitchApi) {
        super(apiBase);
    }

    /**
     * Creates a clip in the streamer's channel
     * @returns A {@linkcode HelixClip} representing the newly created clip
     */
    async createClip(): Promise<HelixClip> {
        try {
            const streamerUserId: string = this.accounts.streamer.userId;

            // First, we actually create the clip and get the ID
            const clipId = await this.streamerClient.clips.createClip({
                channel: streamerUserId
            });

            // Didn't work, so no point in proceeding
            if (clipId == null) {
                return null;
            }

            // Try to get the clip. Sometimes it can take a few seconds, so retry.
            let clip = await this.streamerClient.clips.getClipById(clipId);
            let attempts = 1;
            while (clip == null && attempts < 15) {
                attempts++;
                try {
                    clip = await this.streamerClient.clips.getClipById(clipId);
                } catch (error) {
                    //Failed to get clip
                    this.logger.error("Failed to create clip", error);
                }
                if (clip == null) {
                    await wait(1000);
                }
            }

            return clip;
        } catch (error) {
            this.logger.error("Error creating clip", error);
        }
    }

    /**
     * Gets a Twitch clip from the specified clip URL
     * @param url URL of the clip
     * @returns A {@link HelixClip} from the given URL, or `null` if it doesn't exist
     */
    async getClipFromClipUrl(url: string): Promise<HelixClip> {
        if (url == null) {
            this.logger.warn("No URL specified for getClipFromClipUrl");
            return null;
        }

        const clipId = url.split("/").pop();
        try {
            const clip = await this.streamerClient.clips.getClipById(clipId);

            if (clip == null) {
                this.logger.warn(`No Twitch clip found with clip ID ${clipId}`);
            }

            return clip;
        } catch (error) {
            this.logger.error(`Error while getting Twitch clip from clip ID ${clipId} or URL ${url}`, error);
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

            const clips = await this.streamerClient.clips.getClipsForBroadcaster(userId, filter);

            if (clips?.data?.length > 0) {
                const index = randomInt(1, clips.data.length) - 1;
                return clips.data[index];
            }

            this.logger.warn(`Cannot get random clip for user ID ${extractUserId(userId)}; user has no clips or does not exist`);
        } catch (error) {
            this.logger.error(`Error while getting random clip for user ID ${extractUserId(userId)}: ${(error as Error).message}`);
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
            const user = await this.streamerClient.users.getUserByName(username);

            if (user) {
                return await this.getRandomClipForUserById(user.id, limit, isFeatured, startDate, endDate);
            }

            this.logger.warn(`Cannot get random clip for non-existent user ${username}`);
        } catch (error) {
            this.logger.error(`Error while getting random clip for user ${username}`, error);
        }

        return null;
    }

    /**
     * Get the latest clip for the given user ID.
     *
     * NOTE: Due to how the Twitch API works, this can take several seconds and the clip may not be the very latest.
     * @param userId Twitch user ID
     * @param isFeatured `true` for only featured clips, `false` for only non-featured, or `undefined` for all
     * @returns The most recently created {@link HelixClip} from the user's channel, or `null` if the user doesn't exist or their channel has no clips
     */
    async getLatestClipForUserById(
        userId: UserIdResolvable,
        isFeatured?: boolean
    ): Promise<HelixClip> {
        try {
            const clips = await this.streamerClient.clips.getClipsForBroadcasterPaginated(userId, { isFeatured }).getAll();

            if (clips?.length > 0) {
                // Reverse sort by creation date
                const clip = clips.sort((a, b) => b.creationDate.getTime() - a.creationDate.getTime())[0];
                return clip;
            }

            this.logger.warn(`Cannot get latest clip for user ID ${extractUserId(userId)}; user has no clips or does not exist`);
        } catch (error) {
            this.logger.error(`Error while getting latest clip for user ID ${extractUserId(userId)}: ${(error as Error).message}`);
        }

        return null;
    }

    /**
     * Get the latest clip for the given username.
     *
     * NOTE: Due to how the Twitch API works, this can take several seconds and the clip may not be the very latest.
     * @param username Twitch username
     * @param isFeatured `true` for only featured clips, `false` for only non-featured, or `undefined` for all
     * @returns The most recently created {@link HelixClip} from the user's channel, or `null` if the user doesn't exist or their channel has no clips
     */
    async getLatestClipForUserByName(
        username: string,
        isFeatured?: boolean
    ): Promise<HelixClip> {
        try {
            const user = await this.streamerClient.users.getUserByName(username);

            if (user) {
                return await this.getLatestClipForUserById(user.id, isFeatured);
            }

            this.logger.warn(`Cannot get latest clip for non-existent user ${username}`);
        } catch (error) {
            this.logger.error(`Error while getting latest clip for user ${username}`, error);
        }

        return null;
    }
}