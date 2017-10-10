const Trigger = {
  INTERACTIVE: "interactive",
  COMMAND: "command",
  CUSTOM_SCRIPT: "custom_script",
  API: "api"
}

const Dependency = {
  INTERACTIVE: "interactive",
  CHAT: "chat",
  OVERLAY: "overlay"
}

const effectDefinitions = [
  {
    id: "API_BUTTON",
    name: "API Button",
    triggers: [Trigger.INTERACTIVE, Trigger.CUSTOM_SCRIPT, Trigger.API, Trigger.COMMAND],
    dependencies: [Dependency.CHAT],
    description: "Pull info from third-party APIs"
  },
  {
    id: "CELEBRATION",
    name: "Celebration",
    triggers: [Trigger.INTERACTIVE, Trigger.CUSTOM_SCRIPT, Trigger.API, Trigger.COMMAND],
    dependencies: [Dependency.OVERLAY],
    description: "Fun effects in the overlay"
  },
  {
    id: "CHANGE_GROUP",
    name: "Change Group",
    triggers: [Trigger.INTERACTIVE, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependencies: [Dependency.INTERACTIVE],
    description: "Move a user to a new group"
  },
  {
    id: "CHANGE_SCENE",
    name: "Change Scene",
    triggers: [Trigger.INTERACTIVE, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependencies: [Dependency.INTERACTIVE],
    description: "Move a group to a new scene"
  },
  {
    id: "CHAT",
    name: "Chat",
    triggers: [Trigger.INTERACTIVE, Trigger.CUSTOM_SCRIPT, Trigger.API, Trigger.COMMAND],
    dependencies: [Dependency.CHAT],
    description: "Send a message to chat"
  },
  {
    id: "COOLDOWN",
    name: "Cooldown",
    triggers: [Trigger.INTERACTIVE, Trigger.CUSTOM_SCRIPT, Trigger.API, Trigger.COMMAND],
    dependencies: [Dependency.INTERACTIVE],
    description: "Cooldown some buttons"
  },
  {
    id: "CUSTOM_SCRIPT",
    name: "Custom Script",
    triggers: [Trigger.INTERACTIVE, Trigger.CUSTOM_SCRIPT, Trigger.API, Trigger.COMMAND],
    dependencies: [],
    description: "Run your own script"      
  },
  {
    id: "DELAY",
    name: "Delay",
    triggers: [Trigger.INTERACTIVE, Trigger.CUSTOM_SCRIPT, Trigger.API, Trigger.COMMAND],
    dependencies: [],
    description: "Pause between effects"
  },
  {
    id: "DICE",
    name: "Dice",
    triggers: [Trigger.INTERACTIVE, Trigger.CUSTOM_SCRIPT, Trigger.API, Trigger.COMMAND],
    dependencies: [Dependency.CHAT],
    description: "Roll dice in chat"
  },
  {
    id: "GAME_CONTROL",
    name: "Game Control",
    triggers: [Trigger.INTERACTIVE, Trigger.CUSTOM_SCRIPT, Trigger.API, Trigger.COMMAND],
    dependencies: [],
    description: "Emulate keyboard and mouse clicks"
  },
  {
    id: "HTML",
    name: "HTML",
    triggers: [Trigger.INTERACTIVE, Trigger.CUSTOM_SCRIPT, Trigger.API, Trigger.COMMAND],
    dependencies: [Dependency.OVERLAY],
    description: "Display custom HTML in the overlay"
  },
  {
    id: "PLAY_SOUND",
    name: "Play Sound",
    triggers: [Trigger.INTERACTIVE, Trigger.CUSTOM_SCRIPT, Trigger.API, Trigger.COMMAND],
    dependencies: [],
    description: "Play a sound for listening pleasure"
  },
  {
    id: "SHOW_IMAGE",
    name: "Show Image",
    triggers: [Trigger.INTERACTIVE, Trigger.CUSTOM_SCRIPT, Trigger.API, Trigger.COMMAND],
    dependencies: [Dependency.OVERLAY],
    description: "Display an image on the overlay"
  },
  {
    id: "SHOW_VIDEO",
    name: "Show Video",
    triggers: [Trigger.INTERACTIVE, Trigger.CUSTOM_SCRIPT, Trigger.API, Trigger.COMMAND],
    dependencies: [Dependency.OVERLAY],
    description: "Play a video in the overlay"
  },
  {
    id: "GROUP_LIST",
    name: "Group List",
    triggers: [Trigger.COMMAND],
    dependencies: [Dependency.CHAT, Dependency.INTERACTIVE],
    description: "Returns list of interactive groups"
  },
  {
    id: "SCENE_LIST",
    name: "Scene List",
    triggers: [Trigger.COMMAND],
    dependencies: [Dependency.INTERACTIVE, Dependency.CHAT],
    description: "Returns list of interactive scenes"
  },
  {
    id: "CHANGE_USER_SCENE",
    name: "Change User Scene",
    triggers: [Trigger.COMMAND, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependencies: [Dependency.INTERACTIVE, Dependency.CHAT],
    description: "Changes interactive scene for command user"
  },
  {
    id: "CHANGE_GROUP_SCENE",
    name: "Change Group Scene",
    triggers: [Trigger.COMMAND, Trigger.CUSTOM_SCRIPT, Trigger.API],
    dependencies: [Dependency.INTERACTIVE, Dependency.CHAT],
    description: "Changes scene for interactive group"
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

function getDependenciesForEffect(effectName){
  var effect = getEffectByName(effectName);  
  if(effect == null) {
    return null;
  }
  return effect.dependencies;
}

// Generate 'Enum' objects for all effects
var EffectType = generateEffectObjects();

//export types
exports.DependencyType = Dependency;
exports.TriggerType = Trigger;

exports.EffectType = EffectType;

//export helper functions
exports.getEffectDefinitions = getEffects;
exports.getTriggerTypesForEffect = getTriggerTypesForEffect;
exports.getEffectByName = getEffectByName;
exports.getDependenciesForEffect = getDependenciesForEffect;

exports.effectCanBeTriggered = function(effectName, triggerType) {
  var triggerTypes = getTriggerTypesForEffect(effectName);
  if(triggerTypes == null) return false;
  
  return triggerTypes.includes(triggerType);
}

exports.getEffectDictionary = generateEffectObjects;

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

