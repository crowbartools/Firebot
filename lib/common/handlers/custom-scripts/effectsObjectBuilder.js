// This is used by the custom script processor and the rest api to turn arrays of effects into the effect object that the effect runner accepts

var EffectType = require('../../EffectType.js').EffectType;

exports.buildEffects = function(effectsArray) {
  var builtEffects = {};
  var effectCount = 1;
  effectsArray.forEach(e => {

    var type = e.type;
    var enumSearch = type.toUpperCase().replace(" ", "_");
    if (type != null && type != "" && EffectType[enumSearch] != null) {
      builtEffects[effectCount.toString()] = e;
    } else {
      renderWindow.webContents.send('error', "Custom script or the REST API tried to execute an unknown or unsupported effect type: " + type);
    }

    effectCount++;
  });
  return builtEffects;
}