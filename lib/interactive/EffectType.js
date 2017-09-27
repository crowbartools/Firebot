const Trigger = {
  INTERACTIVE: "interactive",
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
    triggers: [Trigger.INTERACTIVE, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependancies: [Dependancy.CHAT]
  },
  {
    id: "CELEBRATION",
    name: "Celebration",
    triggers: [Trigger.INTERACTIVE, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependancies: [Dependancy.OVERLAY]
  },
  {
    id: "CHANGE_GROUP",
    name: "Change Group",
    triggers: [Trigger.INTERACTIVE, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependancies: [Dependancy.INTERACTIVE]
  },
  {
    id: "CHANGE_SCENE",
    name: "Change Scene",
    triggers: [Trigger.INTERACTIVE, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependancies: [Dependancy.INTERACTIVE]
  },
  {
    id: "CHAT",
    name: "Chat",
    triggers: [Trigger.INTERACTIVE, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependancies: [Dependancy.CHAT]
  },
  {
    id: "COOLDOWN",
    name: "Cooldown",
    triggers: [Trigger.INTERACTIVE, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependancies: [Dependancy.INTERACTIVE]
  },
  {
    id: "CUSTOM_SCRIPT",
    name: "Custom Script",
    triggers: [Trigger.INTERACTIVE, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependancies: [] 
  },
  {
    id: "DELAY",
    name: "Delay",
    triggers: [Trigger.INTERACTIVE, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependancies: []
  },
  {
    id: "DICE",
    name: "Dice",
    triggers: [Trigger.INTERACTIVE, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependancies: [Dependancy.CHAT]
  },
  {
    id: "GAME_CONTROL",
    name: "Game Control",
    triggers: [Trigger.INTERACTIVE, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependancies: []
  },
  {
    id: "HTML",
    name: "HTML",
    triggers: [Trigger.INTERACTIVE, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependancies: [Dependancy.OVERLAY]
  },
  {
    id: "PLAY_SOUND",
    name: "Play Sound",
    triggers: [Trigger.INTERACTIVE, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependancies: []
  },
  {
    id: "SHOW_IMAGE",
    name: "Show Image",
    triggers: [Trigger.INTERACTIVE, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependancies: [Dependancy.OVERLAY]
  },
  {
    id: "SHOW_VIDEO",
    name: "Show Video",
    triggers: [Trigger.INTERACTIVE, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependancies: [Dependancy.OVERLAY]
  }
];

function getEffects(triggerType) {
  // filter effects list to given triggerType
  var filteredEffects = effectDefinitions.filter((e) => {
    if(triggerType != null) {
      return e.triggers.includes(triggerType);
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

// Generate 'Enum' objects for all effects
var EffectType = generateEffectObjects();

//export types
exports.DependancyType = Dependancy;
exports.TriggerType = Trigger;

exports.EffectType = EffectType;

//export helper functions
exports.getEffectDefinitions = getEffects;
exports.getTriggerTypesForEffect = getTriggerTypesForEffect;

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

exports.getEffect = function(effectIdOrName) {
  var effects = effectDefinitions.filter((e) => e.id == effectIdOrName || e.name == effectIdOrName); 
     
  if(effects.length <  1) {
    return null;
  }
  
  return effects[0];
}
