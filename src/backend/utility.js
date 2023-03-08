"use strict";

const moment = require("moment");
const replaceVariableManager = require("./variables/replace-variable-manager");
const accountAccess = require("./common/account-access");
const twitchApi = require("./twitch-api/api");

const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const escapeRegExp = (str) => {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"); // eslint-disable-line no-useless-escape
};

const getUrlRegex = () => {
    return /\b(?:https?:(?:\/\/)?)?(?:[a-z\d](?:[a-z\d-]{0,253}[a-z\d])?\.)+[a-z][a-z\d-]{0,60}[a-z\d](?:$|[\\/]|\w?)+/gi;
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
      " " +
      levels[i][0] +
      " " +
      (levels[i][0] === 1
          ? levels[i][1].substr(0, levels[i][1].length - 1)
          : levels[i][1]);
    }
    return returntext.trim();
};

const formattedSeconds = (secs, simpleOutput = false) => {
    let allSecs = secs;

    allSecs = Math.round(allSecs);
    const hours = Math.floor(allSecs / (60 * 60));

    const divisorForMinutes = allSecs % (60 * 60);
    const minutes = Math.floor(divisorForMinutes / 60);

    const divisorForSeconds = divisorForMinutes % 60;
    const seconds = Math.ceil(divisorForSeconds);

    const hasHours = hours > 0,
        hasMins = minutes > 0,
        hasSecs = seconds > 0;

    if (simpleOutput) {
        return `${hours}:${minutes.toString().padStart(2, "0")}`;
    }

    let uptimeStr = "";

    if (hasHours) {
        uptimeStr = hours + " hour";
        if (hours > 0) {
            uptimeStr = uptimeStr + "s";
        }
    }
    if (hasMins) {
        if (hasHours) {
            uptimeStr = uptimeStr + ",";
        }
        uptimeStr = uptimeStr + " " + minutes + " minute";
        if (minutes > 0) {
            uptimeStr = uptimeStr + "s";
        }
    }
    if (hasSecs) {
        if (hasHours || hasMins) {
            uptimeStr = uptimeStr + ",";
        }
        uptimeStr = uptimeStr + " " + seconds + " second";
        if (seconds > 0) {
            uptimeStr = uptimeStr + "s";
        }
    }

    return uptimeStr;
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
    const durationSecs = moment
        .duration(moment().diff(moment(startedDate)))
        .asSeconds();

    return exports.formattedSeconds(durationSecs);
};

const getDateDiffString = (date1, date2) => {
    const b = moment(date1),
        a = moment(date2),
        intervals = ["years", "months", "days", "hours", "minutes"],
        out = [];

    for (let i = 0; i < intervals.length; i++) {
        const diff = a.diff(b, intervals[i]);
        b.add(diff, intervals[i]);

        if (diff === 0) {
            continue;
        }

        let interval = intervals[i];
        if (diff === 1) {
            interval = interval.slice(0, -1);
        }
        out.push(diff + " " + interval);
    }
    if (out.length > 1) {
        const last = out[out.length - 1];
        out[out.length - 1] = "and " + last;
    }
    return out.length === 2 ? out.join(" ") : out.join(", ");
};

const capitalize = ([first, ...rest]) => {
    return first.toUpperCase() + rest.join("").toLowerCase();
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
const flattenArray = arr => {
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

exports.getRandomInt = getRandomInt;
exports.escapeRegExp = escapeRegExp;
exports.getUrlRegex = getUrlRegex;
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
