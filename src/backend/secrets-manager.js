"use strict";

const logger = require("./logwrapper");

/**
 * @typedef FirebotSecrets
 * @property {string} twitchClientId
 * @property {string} tipeeeStreamClientId
 * @property {string} tipeeeStreamClientSecret
 * @property {string} streamLabsClientId
 * @property {string} streamLabsClientSecret
 */

/**@type {(keyof FirebotSecrets)[]} */
const expectedKeys = [
    "twitchClientId",
    "tipeeeStreamClientId",
    "tipeeeStreamClientSecret",
    "streamLabsClientId",
    "streamLabsClientSecret",
    "fontAwesome5KitId"
];

exports.testSecrets = () => {
    let missingKeys = expectedKeys;
    try {
        /**@type {FirebotSecrets} */
        const secrets = require("../secrets.json") || {};

        missingKeys = expectedKeys.filter(k => secrets[k] == null);

        if (!missingKeys.length) {
            // We have no missing keys
            return true;
        }
    } catch (err) {
        if (err && err.code === "MODULE_NOT_FOUND") {
            logger.error("Unable to find secrets.json in the root directory. Please create one. Contact us in the CrowbarTools Discord if you have any questions.");
            return false;
        }
    }

    logger.error(`secrets.json is missing the following key(s): ${missingKeys.join(", ")}`);
    return false;
};

/**@type {FirebotSecrets} */
let secrets = {};
try {
    secrets = require("../secrets.json");
} catch (error) {
    //silently fail
}

exports.secrets = secrets;