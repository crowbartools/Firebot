"use strict";

const logger = require("./logwrapper");

/**
 * @typedef FirebotSecrets
 * @property {string} twitchClientId
 * @property {string} twitchClientSecret
 * @property {string} tipeeeStreamClientId
 * @property {string} tipeeeStreamClientSecret
 * @property {string} streamLabsClientId
 * @property {string} streamLabsClientSecret
 */

exports.testSecrets = () => {
    try {
        /**@type {FirebotSecrets} */
        const secrets = require("../secrets.json") || {};

        /**@type {(keyof FirebotSecrets)[]} */
        const expected = [
            "twitchClientId",
            "twitchClientSecret",
            "tipeeeStreamClientId",
            "tipeeeStreamClientSecret",
            "streamLabsClientId",
            "streamLabsClientSecret"
        ];
        const missing = expected.filter(k => secrets[k] == null);

        if (missing.length) {
            logger.error(`secrets.json is missing the following keys: ${missing.join(", ")}`);
            return false;
        }

        return true;
    } catch (err) {
        logger.error("Unable to find secrets.json in the root directory. Please create it.");
        return false;
    }
};

/**@type {FirebotSecrets} */
let secrets = {};
try {
    secrets = require("../secrets.json");
} catch (error) {
    //silently fail
}

exports.secrets = secrets;