"use strict";

const { TwitchApi } = require("./streaming-platforms/twitch/api");
const utils = require("./utils");

/** @deprecated Use `utils.humanizeTime()` instead */
const formattedSeconds = (secs, simpleOutput = false) =>
    utils.humanizeTime(secs, simpleOutput === true ? "simple" : "default");

// These need to stay for now for script back-compat
exports.getRandomInt = utils.getRandomInt;
exports.escapeRegExp = utils.escapeRegExp;
exports.getUptime = TwitchApi.streams.getStreamUptime;
exports.getDateDiffString = utils.getDateDiffString;
exports.commafy = utils.commafy;
exports.shuffleArray = utils.shuffleArray;
exports.flattenArray = utils.flattenArray;
exports.secondsForHumans = utils.humanizeTime;
exports.formattedSeconds = formattedSeconds;