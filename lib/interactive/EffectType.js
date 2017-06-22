
const _ = require('underscore')._;

// This is an 'enum' of all available effect types.
var EffectType = {
  API_BUTTON: "API Button",
  CHANGE_GROUP: "Change Group",
  CHANGE_SCENE: "Change Scene",
  CHAT: "Chat",
  COOLDOWN: "Cooldown",
  CELEBRATION: "Celebration",
  DICE: "Dice",
  GAME_CONTROL: "Game Control",
  HTML: "HTML",
  PLAY_SOUND: "Play Sound",
  SHOW_IMAGE: "Show Image",
  CUSTOM_SCRIPT: "Custom Script",
  DELAY: "Delay"
}

exports.EffectType = EffectType;