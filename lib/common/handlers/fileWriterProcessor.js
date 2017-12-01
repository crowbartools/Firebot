'use strict';

const fs = require('fs');
const util = require('../../utility');

exports.run = function(effect, trigger, username, control, commandModel, userCommand) {
    return new Promise((resolve) => {

        if (effect == null || effect.text == null || effect.filepath == null) return;

        // build text replacement dictionary
        let replaceDict = {};
        replaceDict["$(user)"] = username;
        replaceDict["$(text)"] = trigger === 'interactive' ? control.text : commandModel.commandID;
        replaceDict["$(cost)"] = control.cost;
        replaceDict["$(cooldown)"] = control.cooldown;
        if (trigger === 'command') {
            let count = 1;
            userCommand.args.forEach(arg => {
                replaceDict[`$(arg${count})`] = arg;
                count++;
            });
        }

        let text = util.populateStringWithReplaceDict(effect.text, replaceDict);

        if (effect.writeMode === 'append') {
            fs.appendFileSync(effect.filepath, text + "\n", 'utf8');
        } else {
            fs.writeFileSync(effect.filepath, text, 'utf8');
        }

        resolve();
    });
};
