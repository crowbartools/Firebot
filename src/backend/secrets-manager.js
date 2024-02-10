"use strict";

const { resolve } = require('path');
const { readFileSync } = require('fs');

const logger = require("./logwrapper");
const argv = require('./common/argv-parser');



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
    logger.debug("...Starting secrets test");
    let missingKeys = expectedKeys;
    try {

        /**@type {FirebotSecrets} */
        let secrets;
        if (Object.hasOwn(argv, 'fbsecrets-config') && typeof argv['fbsecrets-config'] === 'string' && /^\.json/i.test(argv['fbsecrets-config'])) {
            secrets = JSON.parse(readFileSync(resolve(__dirname, '../', argv['fbsecrets-config']), 'utf-8'));

        } else {
            secrets = require("../secrets.json") || {};
        }

        missingKeys = expectedKeys.filter(k => secrets[k] == null);

        if (!missingKeys.length) {
            // We have no missing keys
            return true;
        }
    } catch (err) {
        if (err && err.code === "MODULE_NOT_FOUND") {
            logger.error("Unable to find secrets.json in the root directory. Please create one. Contact us in the CrowbarTools Discord if you have any questions.");
            return false;
        } else if (err && err.code === 'ENOENT') {
            logger.error(`Unable to find user-specified secrets file '${resolve(__dirname, '../', argv['fb-secrets-json'])}'`);
            return false;
        }
        logger.error(`Secrets file is invalid JSON data`);
        return false;
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