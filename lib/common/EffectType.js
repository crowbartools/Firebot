
const _ = require('underscore')._;

// This is an 'enum' of all available effect types.
var EffectType = {
  API_BUTTON: "API Button",
  CELEBRATION: "Celebration",
  CHANGE_GROUP: "Change Group",
  CHANGE_SCENE: "Change Scene",
  CHAT: "Chat",
  COOLDOWN: "Cooldown",
  CUSTOM_SCRIPT: "Custom Script",
  DELAY: "Delay",
  DICE: "Dice",
  GAME_CONTROL: "Game Control",
  HTML: "HTML",
  PLAY_SOUND: "Play Sound",
  SHOW_IMAGE: "Show Image",
  SHOW_VIDEO: "Show Video"
}

var CommandEffectType = {
  API_BUTTON: "API Button",
  CELEBRATION: "Celebration",
  CHAT: "Chat",
  CUSTOM_SCRIPT: "Custom Script",
  DELAY: "Delay",
  DICE: "Dice",
  GAME_CONTROL: "Game Control",
  HTML: "HTML",
  PLAY_SOUND: "Play Sound",
  SHOW_IMAGE: "Show Image",
  SHOW_VIDEO: "Show Video"
}

exports.EffectType = EffectType;
exports.CommandEffectType = CommandEffectType

exports.getAllEffectTypes = function() {
  return Object.keys(EffectType).map(k => EffectType[k]);
}
