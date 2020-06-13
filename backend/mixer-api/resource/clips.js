"use strict";

const Mixer = require("@mixer/client-node");
const mixerClient = require("../client");
const logger = require("../../logwrapper");

/**
 * Information required to create a clip.
 * @typedef {Object} ClipRequest
 * @property {string} broadcastId - Unique id for the broadcast being clipped
 * @property {string} [highlightTitle] - Title of the clip being created (default is the broadcast title)
 * @property {number} [clipDurationInSeconds] - Length of the clip to create (default 30s, min 5s, max 300s)
 */

/**
 * Information required to find a clip.
 * @typedef {Object} ClipLocator
 * @property {"Thumbnail_Large" | "Thumbnail_Small" | "HlsStreaming" | "Chat"} locatorType - Type of content source this is (e.g. Download, SmoothStreaming, Thumbnail etc.)
 * @property {string} uri - URL for this content source
 */

/**
 * Information about a clip.
 * @typedef {Object} ClipProperties
 * @property {string} contentId - The content ID of this clip.
 * @property {ClipLocator[]} contentLocators - Locator information for this clip (including the thumbnail and content).
 * @property {number} durationInSeconds - Duration of this clip in seconds.
 * @property {Date} expirationDate - Date, in string format, this content will be deleted.
 * @property {string} title - Title of the clip.
 * @property {number} ownerChannelId - Title of the clip.
 * @property {string} shareableId - ID to get the clip and share with users.
 * @property {number} streamerChannelId - Channel ID of the streamer this highlight was clipped from.
 * @property {Date} uploadDate - Date time, in string format, at which this highlight completed upload.
 * @property {number} viewCount - Number of views associated with this clip.
 * @property {number} typeId - The id of the type (game or stream category) the stream was set to when clip was created.
 * @property {1|2|3} contentMaturity - Maturity of the clip (Family = 1, Teen = 2, EighteenPlus = 3).
 * @property {string[]} tags - Tag for clips.
 */

/**
 * Checks if a clip can be created on a given broadcast.
 * @argument {string} typeId - ID of the broadcast.
 * @return {Promise<boolean>}
 */
exports.getStreamerCanClip = async broadcastId => {
    try {
        /**@type {Mixer.IResponse<void>} */
        await mixerClient.streamer.request("get", `clips/broadcasts/${broadcastId}/canClip`);
        return true;
    } catch (error) {
        logger.warning(error);
        return false;
    }
};

/**
 * Creates a clip
 * @argument {ClipRequest} clipRequest - The request to create a clip.
 * @return {Promise<ClipProperties>}
 */
exports.createClip = async clipRequest => {
    try {
        /**@type {Mixer.IResponse<ClipProperties>} */

        const response = await mixerClient.streamer.request("post", `clips/create`, {
            body: clipRequest
        });
        if (response.statusCode !== 200) {
            return null;
        }
        return response.body;
    } catch (error) {
        logger.warning(error);
        return null;
    }
};
