"use strict";

const axios = require("axios").default;
const logger = require("../../logwrapper");

/**
 * @typedef Pronoun
 * @property {string} name
 * @property {string} display
 */

/** @type {Pronoun[]} */
let pronouns = [];

async function retrieveAllPronouns() {
    try {
        pronouns = (await axios.get("https://pronouns.alejo.io/api/pronouns")).data;
    } catch (error) {
        logger.error("Get all pronouns error", error);
    }
}


let pronounCache = {};
async function getUserPronoun(username) {
    if (username == null) {
        return null;
    }

    if (pronounCache[username]) {
        return pronounCache[username];
    }

    try {
        const userPronounData = (await axios.get(`https://pronouns.alejo.io/api/users/${username}`)).data[0];
        const pronoun = pronouns.find(p => p.name === userPronounData.pronoun_id);
        if (pronoun != null) {
            pronounCache[username] = pronoun.display;
            return pronoun.display;
        }
    } catch (error) {
        logger.error(`Failed to get pronoun for ${username}`, error);
    }

    return null;
}

function resetUserPronounCache() {
    pronounCache = {};
}

exports.getUserPronoun = getUserPronoun;
exports.retrieveAllPronouns = retrieveAllPronouns;
exports.resetUserPronounCache = resetUserPronounCache;