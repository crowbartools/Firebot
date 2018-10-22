'use strict';

const { TriggerType } = require('./common/EffectType');
const Chat = require('./common/mixer-chat');
const fs = require('fs');
const moment = require('moment');
const logger = require('./logwrapper');
const request = require("request");
const mathjs = require('mathjs');
const Constellation = require("./live-events/mixer-constellation");
const accountAccess = require("./common/account-access");


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


function getUptimeString(secs) {
    let allSecs = secs;

    allSecs = Math.round(allSecs);
    let hours = Math.floor(allSecs / (60 * 60));

    let divisorForMinutes = allSecs % (60 * 60);
    let minutes = Math.floor(divisorForMinutes / 60);

    let divisorForSeconds = divisorForMinutes % 60;
    let seconds = Math.ceil(divisorForSeconds);

    let hasHours = hours > 0, hasMins = minutes > 0, hasSecs = seconds > 0;

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
}

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

exports.populateStringWithTriggerData = async function(string = "", trigger) {
    if (trigger == null || string === "") return string;

    // build text replacement dictionary
    let replaceDict = {};

    replaceDict["$(user)"] = trigger.metadata.username;

    replaceDict["$(lastSub)"] = Constellation.getLastSub();

    let now = moment();
    replaceDict["$(time)"] = now.format('h:mm a');
    replaceDict["$(time24)"] = now.format('HH:mm');
    replaceDict["$(date)"] = now.format('MMM Do YYYY');

    replaceDict["$(streamer)"] = accountAccess.getAccounts().streamer.username;
    if (accountAccess.getAccounts().bot.loggedIn) {
        replaceDict["$(bot)"] = accountAccess.getAccounts().bot.username;
    }

    if (trigger.type === TriggerType.INTERACTIVE) {
        let control = trigger.metadata.control;
        replaceDict["$(text)"] = control.text;
        replaceDict["$(cost)"] = control.cost;
        replaceDict["$(cooldown)"] = control.cooldown;
        replaceDict["$(activeState)"] = control.disabled ? "disabled" : "enabled";
        replaceDict["$(activeStateReverse)"] = control.disabled ? "enabled" : "disabled";

        let currentProgress = control.progress ? control.progress : 0;
        replaceDict["$(progress)"] = currentProgress * 100;

        replaceDict["$(tooltip)"] = control.tooltip;

        if (control.kind === "textbox") {
            if (trigger.metadata.inputData.value) {
                replaceDict["$(textboxValue)"] = trigger.metadata.inputData.value;
            }
        }
    } else if (trigger.type === TriggerType.COMMAND) {
        replaceDict["$(text)"] = trigger.metadata.command.commandID;

        let args = trigger.metadata.userCommand.args || [];
        let argCount = 1;
        args.forEach(arg => {
            replaceDict[`$(arg${argCount})`] = arg;
            replaceDict[`$(target${argCount})`] = arg.replace("@", "");
            if (argCount === 1) {
                replaceDict[`$(arg)`] = arg;
                replaceDict[`$(target)`] = arg.replace("@", "");
            }
            argCount++;
        });


        let argRangeRe = /\$\(arg(?:(All)|(\d+)-(\d+|Last))\)/gi;

        let argRangeMatches = [];
        let match;
        while ((match = argRangeRe.exec(string)) != null) {
            argRangeMatches.push({
                full: match[0],
                catpureAll: match[1] != null,
                start: match[2],
                end: match[3]
            });
        }

        argRangeMatches.forEach(ar => {
            if (ar.catpureAll) {
                replaceDict[ar.full] = args.join(" ");
            } else {
                let startIndex = parseInt(ar.start) - 1,
                    endIndex = ar.end.toLowerCase() === "last" ? args.length - 1 : parseInt(ar.end) - 1;

                if (startIndex > -1 && startIndex < endIndex && endIndex < args.length) {
                    let endOffset = endIndex + 1;
                    replaceDict[ar.full] = args.slice(startIndex, endOffset).join(" ");
                }
            }
        });

    } else if (trigger.type === TriggerType.EVENT) {
        replaceDict["$(subMonths)"] = trigger.metadata.eventData.totalMonths;
    }

    if (string.includes("randomNumber")) {
        let ranNumRe = /\$\((?:randomNumber)\[(\d+)(?:-(\d+))?\]\)/g;

        let ranNumMatches = [];
        let match;

        while ((match = ranNumRe.exec(string)) != null) {
            ranNumMatches.push({
                full: match[0],
                low: parseInt(match[1]),
                high: match[2] != null ? parseInt(match[2]) : undefined
            });
        }

        for (let ranNumData of ranNumMatches) {
            let low = ranNumData.high != null ? ranNumData.low : 1;
            let high = ranNumData.high != null ? ranNumData.high : ranNumData.low;
            let ranNum = getRandomInt(low, high);
            replaceDict[ranNumData.full] = ranNum;
        }
    }

    string = populateStringWithReplaceDict(string, replaceDict);

    //second round of replacements after the base ones have been filled out
    let replaceDict2 = {};

    if (messageContains(string, ["readFile", "readRandomLine"])) {

        let fileRe = /\$\((?:readFile|readRandomLine)\[([^\]\)]+)\]\)/g; // eslint-disable-line no-useless-escape

        let fileMatches = [];
        let match;
        while ((match = fileRe.exec(string)) != null) {
            fileMatches.push({
                full: match[0],
                filepath: match[1],
                readRandomLine: match[0].includes("readRandomLine")
            });
        }

        fileMatches.forEach(m => {
            if (!m.filepath.endsWith(".txt")) return;
            try {
                let contents = fs.readFileSync(m.filepath, 'utf8');
                if (m.readRandomLine) {
                    let lines = contents.replace(/\r\n/g, '\n').split('\n');
                    let randIndex = getRandomInt(0, lines.length - 1);
                    contents = lines[randIndex];
                }
                replaceDict2[m.full] = contents;
            } catch (err) {
                logger.error("error reading file", err);
            }
        });
    }

    if (string.includes("readApi")) {
        let readApiRe = /\$\((?:readApi)\[(\S+)\](\S*)\)/g;

        let apiMatches = [];
        let match;

        while ((match = readApiRe.exec(string)) != null) {
            apiMatches.push({
                full: match[0],
                url: match[1],
                jsonPathNodes: match[2] ? match[2].split(";") : null
            });
        }

        for (let apiCall of apiMatches) {

            let didError = false;

            let content = await callUrl(apiCall.url).catch(() => {
                didError = true;
            });

            if (didError) {
                replaceDict2[apiCall.full] = "[API ERROR]";
                continue;
            }

            if (apiCall.jsonPathNodes != null) {
                if (content != null) {
                    try {
                        let parsedContent = JSON.parse(content);
                        let currentObject = null;
                        for (let node of apiCall.jsonPathNodes) {
                            let objToTraverse = currentObject === null ? parsedContent : currentObject;
                            if (objToTraverse[node] != null) {
                                currentObject = objToTraverse[node];
                            } else {
                                currentObject = "[JSON PARSE ERROR]";
                                break;
                            }
                        }
                        replaceDict2[apiCall.full] = currentObject != null ? currentObject.toString() : "";
                    } catch (err) {
                        logger.warn("error when parsing api json", err);
                        replaceDict2[apiCall.full] = content ? content.toString() : "[JSON PARSE ERROR]";
                    }
                }
            } else {
                replaceDict2[apiCall.full] = content ? content.toString() : "";
            }
        }
    }

    // Get channel data if chat is connected
    // TODO: we could probably decouple this from chat
    if (Chat.getChatStatus()) {

        if (string.includes("$(randomViewer)")) {

            logger.debug("Getting random viewer...");

            let currentViewers = await Chat.getCurrentViewerList();

            if (currentViewers && currentViewers.length > 0) {
                let randIndex = getRandomInt(0, currentViewers.length - 1);
                replaceDict2["$(randomViewer)"] = currentViewers[randIndex];
            }
        }

        if (string.includes("$(userAvatarUrl)")) {
            let url = await Chat.getUserAvatarUrl(trigger.metadata.username);
            replaceDict2["$(userAvatarUrl)"] = url;
        }

        // Only do the logic for these vars if they are present as theres some heavy lifting
        if (messageContains(string, ['$(uptime', '$(streamTitle', '$(game'])) {
            logger.debug("Getting channel deets...");
            const errorString = "[API ERROR]";
            let channelDeets = await Chat.getGeneralChannelData();
            if (channelDeets != null) {
                if (channelDeets.online) {
                    let startAt = channelDeets.startedAt;

                    let duration = moment.duration(moment().diff(moment(startAt))),
                        seconds = duration.asSeconds();

                    replaceDict2["$(uptime)"] = getUptimeString(seconds);
                } else {
                    replaceDict2["$(uptime)"] = "Not currently broadcasting";
                }

                replaceDict2["$(streamTitle)"] = channelDeets.name;

                replaceDict2["$(game)"] = channelDeets.type != null ? channelDeets.type.name : errorString;

            } else {
                replaceDict2["$(streamTitle)"] = errorString;
                replaceDict2["$(uptime)"] = errorString;
                replaceDict2["$(game)"] = errorString;
            }

            // matches with: $(game[streamerName])
            let gameRe = /\$\((?:game)\[(\S+)\]\)/g;

            let gameMatches = [];
            let match;
            while ((match = gameRe.exec(string)) != null) {
                gameMatches.push({
                    full: match[0],
                    streamer: match[1]
                });
            }

            for (let i = 0; i < gameMatches.length; i++) {
                let g = gameMatches[i];
                let otherChannelDeets = await Chat.getGeneralChannelData(g.streamer, false);
                if (otherChannelDeets != null && otherChannelDeets.type != null) {
                    replaceDict2[g.full] = otherChannelDeets.type.name;
                } else {
                    replaceDict2[g.full] = errorString;
                }
            }
        }
    }

    string = populateStringWithReplaceDict(string, replaceDict2);

    // third replace stage
    let replaceDict3 = {};

    if (string.includes("$(math[")) {
        let mathRe = /\$\((?:math)\[(.+)\]\)/g;

        let mathMatches = [];
        let match;
        while ((match = mathRe.exec(string)) != null) {
            mathMatches.push({
                full: match[0],
                expression: match[1]
            });
        }

        for (let mathData of mathMatches) {
            let evalulation;
            try {
                evalulation = mathjs.eval(mathData.expression);
            } catch (err) {
                logger.warn("error parsing math expression", err);
                evalulation = "[MATH PARSE ERROR]";
            }
            if (typeof evalulation === "object") {
                if (evalulation.entries.length > 0) {
                    evalulation = evalulation.entries[0];
                } else {
                    evalulation = "[MATH PARSE ERROR]";
                }
            }
            replaceDict3[mathData.full] = evalulation;
        }
    }

    return populateStringWithReplaceDict(string, replaceDict3);
};

exports.capitalize = ([first, ...rest]) => first.toUpperCase() + rest.join('').toLowerCase();
