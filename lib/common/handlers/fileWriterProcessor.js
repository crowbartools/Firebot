'use strict';

const fs = require('fs');
const util = require('../../utility');

exports.run = function(effect, trigger) {
    return new Promise(async (resolve) => {

        if (effect == null || effect.text == null || effect.filepath == null) return;

        let text = await util.populateStringWithTriggerData(effect.text, trigger);

        text = text.replace(/\\n/g, "\n");

        if (effect.writeMode === 'append') {
            fs.appendFileSync(effect.filepath, text + "\n", 'utf8');
        } else {
            fs.writeFileSync(effect.filepath, text, 'utf8');
        }

        resolve();
    });
};
