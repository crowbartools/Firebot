"use strict";

const { ReplaceVariableManager } = require("./variables/replace-variable-manager");
const { TwitchApi } = require("./streaming-platforms/twitch/api");
const utils = require("./utils");

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

    return await ReplaceVariableManager.evaluateText(string, trigger, { type: trigger.type, id: triggerId });
};

/** @deprecated Use `utils.getRandomInt()` instead */
const getRandomInt = (min, max) => utils.getRandomInt(min, max);

/** @deprecated Use `utils.escapeRegExp()` instead */
const escapeRegExp = str => utils.escapeRegExp(str);

/** @deprecated Use `utils.humanizeTime()` instead */
const secondsForHumans = seconds => utils.humanizeTime(seconds);

/** @deprecated Use `utils.humanizeTime()` instead */
const formattedSeconds = (secs, simpleOutput = false) =>
    utils.humanizeTime(secs, simpleOutput === true ? "simple" : "default");

/** @deprecated Use `TwitchApi.streams.getStreamUptime()` instead */
const getUptime = async () => await TwitchApi.streams.getStreamUptime();

/** @deprecated Use `utils.getDateDiffString()` instead */
const getDateDiffString = (date1, date2, includeSeconds = false) =>
    utils.getDateDiffString(date1, date2, includeSeconds);

/** @deprecated Use `utils.commafy()` instead */
const commafy = number => utils.commafy(number);

/** @deprecated Use `utils.shuffleArray()` instead */
const shuffleArray = array => utils.shuffleArray(array);

/** @deprecated Use `utils.flattenArray()` instead */
const flattenArray = arr => utils.flattenArray(arr);

exports.getTriggerIdFromTriggerData = getTriggerIdFromTriggerData;
exports.populateStringWithTriggerData = populateStringWithTriggerData;

// These need to stay for now for script back-compat
exports.getRandomInt = getRandomInt;
exports.escapeRegExp = escapeRegExp;
exports.getUptime = getUptime;
exports.getDateDiffString = getDateDiffString;
exports.commafy = commafy;
exports.shuffleArray = shuffleArray;
exports.flattenArray = flattenArray;
exports.secondsForHumans = secondsForHumans;
exports.formattedSeconds = formattedSeconds;