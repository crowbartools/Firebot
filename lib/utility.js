'use strict';

const { TriggerType } = require('./common/EffectType');

function populateStringWithReplaceDict(string = "", replaceDictionary = {}) {
    Object.keys(replaceDictionary).forEach(key => {
        let replacement = replaceDictionary[key];
        string = string.replace(key, replacement);
    });
    return string;
}
exports.populateStringWithReplaceDict = populateStringWithReplaceDict;

exports.populateStringWithTriggerData = function(string = "", trigger) {
    if (trigger == null) return string;

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
    }

    return populateStringWithReplaceDict(string, replaceDict);
};

exports.capitalize = ([first, ...rest]) => first.toUpperCase() + rest.join('').toLowerCase();