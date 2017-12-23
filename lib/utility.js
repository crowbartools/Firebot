'use strict';

const { TriggerType } = require('./common/EffectType');
const fs = require('fs');

function populateStringWithReplaceDict(string = "", replaceDictionary = {}) {
    Object.keys(replaceDictionary).forEach(key => {
        let replacement = replaceDictionary[key];
        string = string.replace(key, replacement);
    });
    return string;
}
exports.populateStringWithReplaceDict = populateStringWithReplaceDict;

exports.populateStringWithTriggerData = function(string = "", trigger) {
    if (trigger == null || string === "") return string;

    // build text replacement dictionary
    let replaceDict = {};

    replaceDict["$(user)"] = trigger.metadata.username;

    if (trigger.type === TriggerType.INTERACTIVE) {
        let control = trigger.metadata.control;
        replaceDict["$(text)"] = control.text;
        replaceDict["$(cost)"] = control.cost;
        replaceDict["$(cooldown)"] = control.cooldown;
        replaceDict["$(progress)"] = control.progress;
        replaceDict["$(tooltip)"] = control.tooltip;
    } else if (trigger.type === TriggerType.COMMAND) {
        replaceDict["$(text)"] = trigger.metadata.command.commandID;

        let argCount = 1;
        trigger.metadata.userCommand.args.forEach(arg => {
            replaceDict[`$(arg${argCount})`] = arg;
            argCount++;
        });
    } else if (trigger.type === TriggerType.EVENT) {
        replaceDict["$(subMonths)"] = trigger.metadata.totalMonths;
    }

    let fileRe = /\$\(readFile\[(\S+)\]\)/g;

    let fileMatches = [];
    let match;
    while ((match = fileRe.exec(string)) != null) {
        fileMatches.push({
            full: match[0],
            filepath: match[1]
        });
    }

    fileMatches.forEach(m => {
        if (!m.filepath.endsWith(".txt")) return;
        try {
            let contents = fs.readFileSync(m.filepath, 'utf8');
            replaceDict[m.full] = contents;
        } catch (err) {
            console.log(`An error occured when trying to read the file '${m.filepath}. Error: ${err}`);
        }
    });

    return populateStringWithReplaceDict(string, replaceDict);
};

exports.capitalize = ([first, ...rest]) => first.toUpperCase() + rest.join('').toLowerCase();