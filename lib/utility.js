'use strict';

const { TriggerType } = require('./common/EffectType');
const fs = require('fs');
const moment = require('moment');


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


exports.populateStringWithTriggerData = function(string = "", trigger) {
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
        replaceDict["$(progress)"] = control.progress;
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
            replaceDict[m.full] = contents;
        } catch (err) {
            console.log(`An error occured when trying to read the file '${m.filepath}. ${err}`);
        }
    });

    return populateStringWithReplaceDict(string, replaceDict);
};

exports.capitalize = ([first, ...rest]) => first.toUpperCase() + rest.join('').toLowerCase();
