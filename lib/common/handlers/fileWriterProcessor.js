'use strict';

const fs = require('fs');
const util = require('../../utility');

exports.run = function(effect, trigger) {
    return new Promise((resolve) => {

        if (effect == null || effect.text == null || effect.filepath == null) return;

        let text = util.populateStringWithTriggerData(effect.text, trigger);

        if (effect.writeMode === 'append') {
            fs.appendFileSync(effect.filepath, text + "\n\r", 'utf8');
        } else {
            fs.writeFileSync(effect.filepath, text, 'utf8');
        }

        resolve();
    });
};
