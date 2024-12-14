"use strict";

const { randomInt } = require('node:crypto');
const { DateTime, Duration } = require("luxon");
const fs = require("fs/promises");
const replaceVariableManager = require("./variables/replace-variable-manager");
const accountAccess = require("./common/account-access");
const twitchApi = require("./twitch-api/api");

const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.max(Math.floor(max), min); // Ensure max is at least equal to min

    // randomInt is max exclusive, so we add 1 to make inclusive
    return randomInt(min, max + 1);
};

const escapeRegExp = (str) => {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"); // eslint-disable-line no-useless-escape
};

const getUrlRegex = () => {
    return /\b(?:https?:(?:\/\/)?)?(?:[a-z\d](?:[a-z\d-]{0,253}[a-z\d])?\.)+[a-z][a-z\d-]{0,60}[a-z\d](?:$|[\\/]|\w?)+/gi;
};

const getNonGlobalUrlRegex = () => {
    return /\b(?:https?:(?:\/\/)?)?(?:[a-z\d](?:[a-z\d-]{0,253}[a-z\d])?\.)+[a-z][a-z\d-]{0,60}[a-z\d](?:$|[\\/]|\w?)+/i;
};

/**
 * @param {*} subject
 * @returns {string}
 */
const convertToString = (subject) => {
    if (subject == null) {
        return '';
    }
    if (typeof subject === 'string' || subject instanceof String) {
        return `${subject}`;
    }

    return JSON.stringify(subject);
};

/**
 * Translates seconds into human readable format of seconds, minutes, hours, days, and years
 *
 * @param  {number} seconds The number of seconds to be processed
 * @return {string}         The phrase describing the the amount of time
 */
const secondsForHumans = (seconds) => {
    const levels = [
        [Math.floor(seconds / 31536000), "years"],
        [Math.floor((seconds % 31536000) / 86400), "days"],
        [Math.floor(((seconds % 31536000) % 86400) / 3600), "hours"],
        [Math.floor((((seconds % 31536000) % 86400) % 3600) / 60), "minutes"],
        [(((seconds % 31536000) % 86400) % 3600) % 60, "seconds"]
    ];
    let returntext = "";

    for (let i = 0, max = levels.length; i < max; i++) {
        if (levels[i][0] === 0) {
            continue;
        }
        returntext +=
            ` ${levels[i][0]
            } ${levels[i][0] === 1
                ? levels[i][1].substr(0, levels[i][1].length - 1)
                : levels[i][1]}`;
    }
    return returntext.trim();
};

const formattedSeconds = (secs, simpleOutput = false) => {
    const duration = Duration.fromDurationLike({ seconds: Math.round(secs) }).rescale();

    if (simpleOutput === true) {
        if (simpleOutput) {
            return duration.shiftTo("hours", "minutes").toFormat("h:mm");
        }
    }

    const shiftedDuration = duration.shiftToAll();
    const units = ["years", "months", "days", "hours", "minutes", "seconds"];
    const nonZeroUnits = [];

    for (const unit of units) {
        if (shiftedDuration.get(unit) > 0) {
            nonZeroUnits.push(unit);
        }
    }

    return duration.shiftTo(...nonZeroUnits).toHuman({ listStyle: "narrow" });
};

const getTriggerIdFromTriggerData = (trigger) => {
    const { eventSource, event } = trigger.metadata;

    if (eventSource && event) {
        return `${eventSource.id}:${event.id}`;
    }

    return undefined;
};


const populateStringWithTriggerData = async (string = "", trigger) => {
    if (trigger == null || string === "") {
        return string;
    }

    const triggerId = getTriggerIdFromTriggerData(trigger);

    return await replaceVariableManager.evaluateText(string, trigger, { type: trigger.type, id: triggerId });
};

const getUptime = async () => {
    const client = twitchApi.streamerClient;

    const streamerAccount = accountAccess.getAccounts().streamer;
    const channelData = await client.streams.getStreamByUserId(streamerAccount.userId);

    if (channelData == null) {
        return "Not currently broadcasting";
    }

    const startedDate = channelData.startDate;
    return exports.getDateDiffString(startedDate, new Date(), true);
};

const getDateDiffString = (date1, date2, includeSeconds = false) => {
    let b = DateTime.fromJSDate(date1);
    const a = DateTime.fromJSDate(date2),
        intervals = ["years", "months", "days", "hours", "minutes"],
        out = [];

    if (includeSeconds === true) {
        intervals.push("seconds");
    }

    for (let i = 0; i < intervals.length; i++) {
        const diff = a.diff(b, intervals[i]);
        const numericDiff = Math.trunc(diff.get(intervals[i]));

        if (numericDiff === 0) {
            continue;
        }

        b = b.plus(Duration.fromDurationLike({ [intervals[i]]: numericDiff }));

        let interval = intervals[i];
        if (numericDiff === 1) {
            interval = interval.slice(0, -1);
        }
        out.push(`${numericDiff} ${interval}`);
    }
    if (out.length > 1) {
        const last = out[out.length - 1];
        out[out.length - 1] = `and ${last}`;
    }
    return out.length === 2 ? out.join(" ") : out.join(", ");
};

const capitalize = (word) => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
};

const commafy = (number) => {
    return number == null ? number : number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * Shuffles an array.
 *
 * @param {[]} array The array to shuffle
 *
 * @returns {[]} A shuffled copy of the passed array
 */
const shuffleArray = (array) => {
    const arrayCopy = array.slice(0);
    for (let i = arrayCopy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arrayCopy[i], arrayCopy[j]] = [arrayCopy[j], arrayCopy[i]];
    }
    return arrayCopy;
};

/**
 * Flattens nested arrays
 *
 * @param {[]} array An array of arrays
 *
 * @returns {[]} A flattened copy of the passed array
 */
const flattenArray = (arr) => {
    return arr.reduce((flat, next) => flat.concat(next), []);
};

/**
 *  parses a JSON string
 *
 * @param {string} string to parse as JSON
 *
 * @returns {string} Object, Array, string, number, boolean, or null value corresponding to the given JSON
 */
const jsonParse = (json) => {
    try {
        json = JSON.parse(json);
    } catch (err) {
        return json;
    }
    return json;
};

const wait = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Deeply clones the given subject; supports circular references
 * @param {*} subject Subject to clone
 * @param {boolean} [freeze=false] If true the cloned instance will be frozen
 * @param {Map<*,*>} [cloning] Internal; map of members currently being cloned
 * @returns {*} Cloned instance of subject
 */
const deepClone = (subject, freeze = false, cloning) => {
    if (subject == null || typeof subject !== 'object') {
        return subject;
    }

    if (cloning == null) {
        cloning = new Map();
    }

    const result = Array.isArray(subject) ? [] : {};
    for (const [key, value] of Object.entries(subject)) {
        if (value == null || typeof value !== 'object') {
            result[key] = value;

            // value is in the process of being cloned as a result of circular reference
            // use the cached cloning value
        } else if (cloning.has(value)) {
            result[key] = cloning.get(value);

        } else {
            cloning.set(value, result);
            result[key] = deepClone(value, freeze, cloning);
            cloning.delete(value);
        }
    }
    if (freeze) {
        Object.freeze(result);
    }
    return result;
};

/**
 * Deeply freezes the given subject; supports circular references
 * @param {*} subject The subject to deep freeze
 * @returns {*} the frozen subject
 */
const deepFreeze = (subject) => {
    if (subject == null || typeof subject !== 'object') {
        return subject;
    }

    // Freeze subject before walking properties to prevent inf-loop
    // caused by circular references
    Object.freeze(subject);
    for (const value of Object.values(subject)) {
        if (!Object.isFrozen(value)) {
            deepFreeze(value);
        }
    }
    return subject;
};

const emptyFolder = async (folderPath) => {
    const entries = await fs.readdir(folderPath);

    for (const entry of entries) {
        await fs.rm(entry, { recursive: true, force: true });
    }
};

const findIndexIgnoreCase = (array, element) => {
    if (Array.isArray(array)) {
        element = element.toString().toLowerCase();
        const search = array.findIndex(e => e.toString().toLowerCase() === element);
        return search;
    }

    return -1;
};

/**
 * extract a property from an object using a dot-notation property path
 * @param {Object} obj input object
 * @param {string} path dot-notation based property path
 * @param {*} defaultValue default value if no value exists at the specified path
 * @returns {*|undefined} value at path, defaultValue or undefined
 */
const extractPropertyWithPath = (obj, path, defaultValue = undefined) => {
    const propertyPath = path.split(".");
    let data = structuredClone(obj);
    try {
        for (const item of propertyPath) {
            if (data === undefined) {
                return defaultValue;
            }
            data = data[item];
        }
        return data ?? defaultValue;
    } catch (_) {
        return defaultValue;
    }
};

exports.getRandomInt = getRandomInt;
exports.escapeRegExp = escapeRegExp;
exports.getUrlRegex = getUrlRegex;
exports.getNonGlobalUrlRegex = getNonGlobalUrlRegex;
exports.secondsForHumans = secondsForHumans;
exports.formattedSeconds = formattedSeconds;
exports.getTriggerIdFromTriggerData = getTriggerIdFromTriggerData;
exports.populateStringWithTriggerData = populateStringWithTriggerData;
exports.getUptime = getUptime;
exports.getDateDiffString = getDateDiffString;
exports.capitalize = capitalize;
exports.commafy = commafy;
exports.shuffleArray = shuffleArray;
exports.flattenArray = flattenArray;
exports.jsonParse = jsonParse;
exports.wait = wait;
exports.convertToString = convertToString;
exports.deepClone = deepClone;
exports.deepFreeze = deepFreeze;
exports.emptyFolder = emptyFolder;
exports.findIndexIgnoreCase = findIndexIgnoreCase;
exports.extractPropertyWithPath = extractPropertyWithPath;
