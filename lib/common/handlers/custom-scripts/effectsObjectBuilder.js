// This is used by the custom script processor and the rest api to turn arrays of effects into the effect object that the effect runner accepts

'use strict';

let EffectType = require('../../EffectType.js').EffectType;

exports.buildEffects = function(effectsArray) {
    if (effectsArray == null) {
        effectsArray = [];
    }
    let builtEffects = {};
    let effectCount = 1;
    effectsArray.forEach(e => {

        let type = e.type;
        let enumSearch = type.toUpperCase().replace(" ", "_");
        if (type !== null && type !== "" && EffectType[enumSearch] != null) {
            builtEffects[effectCount.toString()] = e;
        } else {
            renderWindow.webContents.send('error', "Attempted to build an unknown or unsupported effect type: " + type);
        }

        effectCount++;
    });
    return builtEffects;
};
