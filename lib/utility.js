'use strict';

const { TriggerType } = require('./common/EffectType');
const Chat = require('./common/mixer-chat');
const fs = require('fs');
const moment = require('moment');
const logger = require('./logwrapper');


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

exports.populateStringWithTriggerData = async function(string = "", trigger) {
    if (trigger == null || string === "") return string;

    // build text replacement dictionary
    let replaceDict = {};

    replaceDict["$(user)"] = trigger.metadata.username;

    let now = moment();
    replaceDict["$(time)"] = now.format('h:mm a');
    replaceDict["$(time24)"] = now.format('HH:mm');

    if (trigger.type === TriggerType.INTERACTIVE) {
        let control = trigger.metadata.control;
        replaceDict["$(text)"] = control.text;
        replaceDict["$(cost)"] = control.cost;
        replaceDict["$(cooldown)"] = control.cooldown;

        let currentProgress = control.progress ? control.progress : 0;
        replaceDict["$(progress)"] = currentProgress * 100;

        replaceDict["$(tooltip)"] = control.tooltip;
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
        replaceDict["$(subMonths)"] = trigger.metadata.totalMonths;
    }

    string = populateStringWithReplaceDict(string, replaceDict);

    //second round of replacements after others have been filled out
    let replaceDict2 = {};

    let fileRe = /\$\((?:readFile|readRandomLine)\[(\S+)\]\)/g;

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
            logger.error(err);
        }
    });

    // Get channel data if chat is connected
    // TODO: we could probably decouple this from chat
    if (Chat.getChatStatus()) {

        // Only do the logic for these vars if they are present as theres some heavy lifting
        if (messageContains(string, ['$(uptime', '$(streamTitle', '$(game'])) {
            logger.info("Getting channel deets...");
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


    return populateStringWithReplaceDict(string, replaceDict2);
};

exports.capitalize = ([first, ...rest]) => first.toUpperCase() + rest.join('').toLowerCase();
