
const Trigger = {
  INTERACTIVE: "interactive",
  COMMAND: "command",
  CUSTOM_SCRIPT: "custom_script",
  API: "api"
}

const Dependancy = {
  INTERACTIVE: "interactive",
  CHAT: "chat",
  OVERLAY: "overlay"
}

const effectDefinitions = [
  {
    id: "API_BUTTON",
    name: "API Button",
    triggerableBy: [Trigger.INTERACTIVE, Trigger.COMMAND, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependancies: [Dependancy.CHAT]
  },
  {
    id: "CELEBRATION",
    name: "Celebration",
    triggerableBy: [Trigger.INTERACTIVE, Trigger.COMMAND, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependancies: [Dependancy.OVERLAY]
  },
  {
    id: "CHANGE_GROUP",
    name: "Change Group",
    triggerableBy: [Trigger.INTERACTIVE, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependancies: [Dependancy.INTERACTIVE]
  },
  {
    id: "CHANGE_SCENE",
    name: "Change Scene",
    triggerableBy: [Trigger.INTERACTIVE, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependancies: [Dependancy.INTERACTIVE]
  },
  {
    id: "CHAT",
    name: "Chat",
    triggerableBy: [Trigger.INTERACTIVE, Trigger.COMMAND, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependancies: [Dependancy.CHAT]
  },
  {
    id: "COOLDOWN",
    name: "Cooldown",
    triggerableBy: [Trigger.INTERACTIVE, Trigger.COMMAND, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependancies: [Dependancy.INTERACTIVE]
  },
  {
    id: "CHANGE_USER_SCENE",
    name: "Change User Scene",
    triggerableBy: [Trigger.COMMAND, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependancies: [Dependancy.INTERACTIVE, Dependancy.CHAT]
  },
  {
    id: "CHANGE_GROUP_SCENE",
    name: "Change Group Scene",
    triggerableBy: [Trigger.COMMAND, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependancies: [Dependancy.INTERACTIVE, Dependancy.CHAT]
  },
  {
    id: "CUSTOM_SCRIPT",
    name: "Custom Script",
    triggerableBy: [Trigger.INTERACTIVE, Trigger.COMMAND, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependancies: [] 
  },
  {
    id: "DELAY",
    name: "Delay",
    triggerableBy: [Trigger.INTERACTIVE, Trigger.COMMAND, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependancies: []
  },
  {
    id: "DICE",
    name: "Dice",
    triggerableBy: [Trigger.INTERACTIVE, Trigger.COMMAND, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependancies: [Dependancy.CHAT]
  },
  {
    id: "GAME_CONTROL",
    name: "Game Control",
    triggerableBy: [Trigger.INTERACTIVE, Trigger.COMMAND, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependancies: []
  },
  {
    id: "GROUP_LIST",
    name: "Group List",
    triggerableBy: [Trigger.COMMAND],
    dependancies: [Dependancy.CHAT, Dependancy.INTERACTIVE]
  },
  {
    id: "SCENE_LIST",
    name: "Scene List",
    triggerableBy: [Trigger.COMMAND],
    dependancies: [Dependancy.INTERACTIVE, Dependancy.CHAT]
  },
  {
    id: "HTML",
    name: "HTML",
    triggerableBy: [Trigger.INTERACTIVE, Trigger.COMMAND, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependancies: [Dependancy.OVERLAY]
  },
  {
    id: "PLAY_SOUND",
    name: "Play Sound",
    triggerableBy: [Trigger.INTERACTIVE, Trigger.COMMAND, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependancies: []
  },
  {
    id: "SHOW_IMAGE",
    name: "Show Image",
    triggerableBy: [Trigger.INTERACTIVE, Trigger.COMMAND, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependancies: [Dependancy.OVERLAY]
  },
  {
    id: "SHOW_VIDEO",
    name: "Show Video",
    triggerableBy: [Trigger.INTERACTIVE, Trigger.COMMAND, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependancies: [Dependancy.OVERLAY]
  }
]

function getEffects(triggerType) {
  // filter effects list to given triggerType
  var filteredEffects = effectDefinitions.filter((e) => {
    if(triggerType != null) {
      return e.triggerableBy.includes(triggerType);
    } 
    else {
      return true;
    }
  });
  return filteredEffects;
}

function generateEffectObjects(triggerType) {
  var effectsObject = {};
  var filteredEffects = getEffects(triggerType);
  filteredEffects.forEach((e) => {
    effectsObject[e.id] = e.name;
  });
  return effectsObject;
}

function getEffectByName(effectName) {
  var effect = effectDefinitions.filter((e) => e.name == effectName);  
  if(effect.length <  1) {
    return null;
  }
  return effect[0];
}

function getEffectById(effectId) {
  var effect = effectDefinitions.filter((e) => e.id == effectId);  
  if(effect.length <  1) {
    return null;
  }
  return effect[0];
}

function getTriggerTypesForEffect(effectName) {
  var effect = getEffectByName(effectName);  
  if(effect == null) {
    return null;
  }
  return effect.triggerTypes;
};

// Generate 'Enum' objects for all effects, just interactive, and just commands
// Way may only need the single "effecttype" that contains all effects, and then use the helper methods
// to get specific lists or see if an effect is triggerable or not
var EffectType = generateEffectObjects();
var InteractiveEffectType = generateEffectObjects(Trigger.INTERACTIVE);
var CommandEffectType = generateEffectObjects(Trigger.COMMAND);

//export types
exports.DependancyType = Dependancy;
exports.TriggerType = Trigger;

exports.EffectType = CommandEffectType;
exports.InteractiveEffectType = InteractiveEffectType;
exports.CommandEffectType = CommandEffectType;

//export helper functions
exports.getEffectTypesForTrigger = getEffects;
exports.getTriggerTypesForEffect = getTriggerTypesForEffect;
exports.getEffectByName = getEffectByName;

exports.effectCanBeTriggered = function(effectName, triggerType) {
  var triggerTypes = getTriggerTypesForEffect(effectName);
  if(triggerTypes == null) return false;
  
  return triggerTypes.includes(triggerType);
}

exports.getAllEffectTypes = function(triggerType) {
  // if triggerType is null, all effects are returned
  var effects = getEffects(triggerType);
  
  //map to just an array of names and return
  return effects.map(e => e.name);
}
