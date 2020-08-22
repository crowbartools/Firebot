"use strict";

const request = require("request");

const accountAccess = require("./account-access");

/**
 * An Elixr Emote
 * @typedef {Object} ElixrEmote
 * @property {string} id - The emote id
 * @property {string} code - The text code that triggers this emote
 * @property {number} maxSize - The maxSize, default to 50
 * @property {boolean} animated  - whether or not the emote is animated
 */

/**
 * Emote data for a channel
 * @typedef {Object} EmoteData
 * @property {number} channelId - The id of the current channel
 * @property {ElixrEmote[]} channelEmotes - List of {@link ElixrEmote}s saved for this channel
 * @property {ElixrEmote[]} globalEmotes - List of globally available {@link ElixrEmote}s
 * @property {string} channelEmoteUrlTemplate - the url template for channelEmotes
 * @property {string} globalEmoteUrlTemplate - the url template for globalEmotes
 */

/**
 * @type {EmoteData}
 */
let cachedEmoteData = null;


/**
 * Returns cached emote data
 * @return {EmoteData} Cached {@link EmoteData}
 */
function getEmotes() {
    return cachedEmoteData;
}

function updateEmotesCache() {
    return new Promise(resolve => {
        //updating account cache

        let streamerData = accountAccess.getAccounts().streamer;
        let rootUrl = `https://api.mixrelixr.com/v1/emotes/` + streamerData.username;
        let options = {
            url: rootUrl,
            method: 'GET',
            headers: {
                'User-Agent': 'Firebot Client'
            }
        };

        request(options, function(err, res) {
            let emotes = JSON.parse(res.body);
            cachedEmoteData = emotes;
            resolve(true);
        });
    });
}

exports.getEmotes = getEmotes;
exports.updateEmotesCache = updateEmotesCache;