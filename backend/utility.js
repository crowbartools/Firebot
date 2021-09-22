"use strict";

const moment = require("moment");

/* unused
const logger = require("./logwrapper");
const request = require("request");
*/

const replaceVariableManager = require("./variables/replace-variable-manager");

const accountAccess = require("./common/account-access");
const twitchApi = require("./twitch-api/api");

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

exports.getRandomInt = getRandomInt;

function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"); // eslint-disable-line no-useless-escape
}
exports.escapeRegExp = escapeRegExp;

function populateStringWithReplaceDict(string = "", replaceDictionary = {}) {
    Object.keys(replaceDictionary).forEach(key => {
        let replacement = replaceDictionary[key];
        string = string.replace(new RegExp(escapeRegExp(key), "g"), replacement);
    });
    return string;
}
exports.populateStringWithReplaceDict = populateStringWithReplaceDict;

/**
 * Translates seconds into human readable format of seconds, minutes, hours, days, and years
 *
 * @param  {number} seconds The number of seconds to be processed
 * @return {string}         The phrase describing the the amount of time
 */
exports.secondsForHumans = function(seconds) {
    let levels = [
        [Math.floor(seconds / 31536000), "years"],
        [Math.floor((seconds % 31536000) / 86400), "days"],
        [Math.floor(((seconds % 31536000) % 86400) / 3600), "hours"],
        [Math.floor((((seconds % 31536000) % 86400) % 3600) / 60), "minutes"],
        [(((seconds % 31536000) % 86400) % 3600) % 60, "seconds"]
    ];
    let returntext = "";

    for (let i = 0, max = levels.length; i < max; i++) {
        if (levels[i][0] === 0) continue;
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

exports.formattedSeconds = (secs, simpleOutput = false) => {
    let allSecs = secs;

    allSecs = Math.round(allSecs);
    let hours = Math.floor(allSecs / (60 * 60));

    let divisorForMinutes = allSecs % (60 * 60);
    let minutes = Math.floor(divisorForMinutes / 60);

    let divisorForSeconds = divisorForMinutes % 60;
    let seconds = Math.ceil(divisorForSeconds);

    let hasHours = hours > 0,
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

exports.anyPromise = function(promises) {
    return Promise.all(promises.map(p => {
        // If a request fails, count that as a resolution so it will keep
        // waiting for other possible successes. If a request succeeds,
        // treat it as a rejection so Promise.all immediately bails out.
        return p.then(
            val => Promise.reject(val),
            err => Promise.resolve(err)
        );
    })).then(
        // If '.all' resolved, we've just got an array of errors.
        errors => Promise.reject(errors),
        // If '.all' rejected, we've got the result we wanted.
        val => Promise.resolve(val)
    );
};

/* Unused
function messageContains(message, queries) {
    return queries.some(q => message.includes(q));
}

function callUrl(url) {
    return new Promise((resolve, reject) => {
        request(url, (error, resp, body) => {
            if (error) {
                logger.warn("error calling readApi url: " + url, error);
                reject(error);
            } else {
                resolve(body);
            }
        });
    });
}
*/

function getTriggerIdFromTriggerData(trigger) {

    switch (trigger.type) {
    case "interactive":
        return trigger.metadata.control && trigger.metadata.control.kind;
    case "event": {
        let eventSource = trigger.metadata.eventSource,
            event = trigger.metadata.event;
        if (eventSource && event) {
            return `${eventSource.id}:${event.id}`;
        }
    }
    }

    return undefined;
}


exports.populateStringWithTriggerData = async function(string = "", trigger) {
    if (trigger == null || string === "") return string;

    let triggerId = getTriggerIdFromTriggerData(trigger);

    return await replaceVariableManager.evaluateText(string, trigger, { type: trigger.type, id: triggerId });
};

exports.getUptime = async () => {
    const client = twitchApi.getClient();

    const streamerAccount = accountAccess.getAccounts().streamer;
    const channelData = await client.streams.getStreamByUserName(streamerAccount.username);

    if (channelData == null) {
        return "Not currently broadcasting";
    }

    const startedDate = channelData.startDate;
    const durationSecs = moment
        .duration(moment().diff(moment(startedDate)))
        .asSeconds();

    return exports.formattedSeconds(durationSecs);
};

exports.getDateDiffString = function(date1, date2) {
    let b = moment(date1),
        a = moment(date2),
        intervals = ["years", "months", "days", "hours", "minutes"],
        out = [];

    for (let i = 0; i < intervals.length; i++) {
        let diff = a.diff(b, intervals[i]);
        b.add(diff, intervals[i]);

        if (diff === 0) continue;

        let interval = intervals[i];
        if (diff === 1) {
            interval = interval.slice(0, -1);
        }
        out.push(diff + " " + interval);
    }
    if (out.length > 1) {
        let last = out[out.length - 1];
        out[out.length - 1] = "and " + last;
    }
    return out.length === 2 ? out.join(" ") : out.join(", ");
};

exports.capitalize = ([first, ...rest]) =>
    first.toUpperCase() + rest.join("").toLowerCase();

exports.commafy = (number) => {
    return number == null ? number : number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * Shuffles an array.
 *
 * @param {[]} array The array to shuffle
 *
 * @returns {[]} A shuffled copy of the passed array
 */
exports.shuffleArray = function(array) {
    let arrayCopy = array.slice(0);
    for (let i = arrayCopy.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
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
exports.flattenArray = arr => arr.reduce((flat, next) => flat.concat(next), []);

exports.wait = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};


/**
 * @param {string} pattern Converts a wildcard text expression into a RegExp instance
 * @returns {RegExp}
 */
exports.wildcardToRegex = pattern => new RegExp(
    '^' + pattern
        // removing lead/trailing whitespace
        .trim()

        // escape irrelevent non alpha-numeric characters
        .replace(/[^\w\s?*]/g, '\\$&')

        // convert wildcard special characters to regex equivulants
        // ? = any 1 character
        // * = 0 or more characters
        .replace(/[?*]+/gi, match => {
            const hasAstrick = match.indexOf('*') > -1;
            const qs = match.split('?').length - 1;
            if (!qs) {
                return '.*';
            }
            return '.'.repeat(qs) + (hasAstrick ? '+' : '');
        }) + '$',
    'i'
);