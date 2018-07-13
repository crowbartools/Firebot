'use strict';

const Trigger = {
    INTERACTIVE: "interactive",
    COMMAND: "command",
    CUSTOM_SCRIPT: "custom_script",
    API: "api",
    EVENT: "event",
    HOTKEY: "hotkey",
    MANUAL: "manual"
};

const ALL_TRIGGERS = Object.values(Trigger);

const Dependency = {
    INTERACTIVE: "interactive",
    CHAT: "chat",
    CONSTELLATION: "constellation",
    OVERLAY: "overlay"
};


const effectDefinitions = [
    {
        id: "API_BUTTON",
        name: "API Button",
        triggers: ALL_TRIGGERS,
        dependencies: [Dependency.CHAT],
        description: "Pull info from third-party APIs"
    },
    {
        id: "CELEBRATION",
        name: "Celebration",
        triggers: ALL_TRIGGERS,
        dependencies: [Dependency.OVERLAY],
        description: "Fun effects in the overlay"
    },
    {
        id: "CHANGE_GROUP",
        name: "Change Group",
        triggers: [Trigger.INTERACTIVE, Trigger.CUSTOM_SCRIPT, Trigger.API, Trigger.EVENT, Trigger.HOTKEY],
        dependencies: [Dependency.INTERACTIVE],
        description: "Move a user to a new group"
    },
    {
        id: "CHANGE_SCENE",
        name: "Change Scene",
        triggers: [Trigger.INTERACTIVE, Trigger.CUSTOM_SCRIPT, Trigger.API, Trigger.EVENT, Trigger.HOTKEY],
        dependencies: [Dependency.INTERACTIVE],
        description: "Move a group to a new scene"
    },
    {
        id: "CHAT",
        name: "Chat",
        triggers: ALL_TRIGGERS,
        dependencies: [Dependency.CHAT],
        description: "Send a message to chat"
    },
    {
        id: "COOLDOWN",
        name: "Cooldown",
        triggers: [Trigger.INTERACTIVE, Trigger.CUSTOM_SCRIPT, Trigger.API, Trigger.COMMAND, Trigger.EVENT, Trigger.HOTKEY],
        dependencies: [Dependency.INTERACTIVE],
        description: "Cooldown some buttons"
    },
    {
        id: "CUSTOM_SCRIPT",
        name: "Custom Script",
        triggers: ALL_TRIGGERS,
        dependencies: [],
        description: "Run your own script"
    },
    {
        id: "RUN_COMMAND",
        name: "Run Command",
        triggers: [Trigger.CUSTOM_SCRIPT, Trigger.API, Trigger.MANUAL, Trigger.HOTKEY],
        dependencies: [],
        description: "Run a command via another trigger"
    },
    {
        id: "DELAY",
        name: "Delay",
        triggers: ALL_TRIGGERS,
        dependencies: [],
        description: "Pause between effects"
    },
    {
        id: "DICE",
        name: "Dice",
        triggers: ALL_TRIGGERS,
        dependencies: [Dependency.CHAT],
        description: "Roll dice in chat"
    },
    {
        id: "GAME_CONTROL",
        name: "Game Control",
        triggers: ALL_TRIGGERS,
        dependencies: [],
        description: "Emulate keyboard and mouse clicks"
    },
    {
        id: "HTML",
        name: "HTML",
        triggers: ALL_TRIGGERS,
        dependencies: [Dependency.OVERLAY],
        description: "Display custom HTML in the overlay"
    },
    {
        id: "SHOW_EVENTS",
        name: "Show Event",
        triggers: ALL_TRIGGERS,
        dependencies: [Dependency.OVERLAY],
        description: "Send an event to the Event List"
    },
    {
        id: "PLAY_SOUND",
        name: "Play Sound",
        triggers: ALL_TRIGGERS,
        dependencies: [],
        description: "Play a sound for listening pleasure"
    },
    {
        id: "RANDOM_EFFECT",
        name: "Random Effect",
        triggers: ALL_TRIGGERS,
        dependencies: [],
        description: "Run a random effect from a list of effects"
    },
    {
        id: "EFFECT_GROUP",
        name: "Effect Group",
        triggers: ALL_TRIGGERS,
        dependencies: [],
        description: "Group multiple effects to be treated as one (good for Random Effect use)"
    },
    {
        id: "SHOW_IMAGE",
        name: "Show Image",
        triggers: ALL_TRIGGERS,
        dependencies: [Dependency.OVERLAY],
        description: "Display an image on the overlay"
    },
    {
        id: "CREATE_CLIP",
        name: "Create Clip",
        triggers: ALL_TRIGGERS,
        dependencies: [],
        description: "Triggers a clip to be made on Mixer for a given duration."
    },
    {
        id: "SHOW_VIDEO",
        name: "Show Video",
        triggers: ALL_TRIGGERS,
        dependencies: [Dependency.OVERLAY],
        description: "Play a video in the overlay"
    },
    {
        id: "CLEAR_EFFECTS",
        name: "Clear Effects",
        triggers: ALL_TRIGGERS,
        dependencies: [],
        description: "Clear and stop any currently running effects (sounds and overlay effects)."
    },
    {
        id: "TEXT_TO_FILE",
        name: "Write Text To File",
        triggers: ALL_TRIGGERS,
        dependencies: [],
        description: "Write customizable text to a file"
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
        id: "COMMAND_LIST",
        name: "Command List",
        triggers: [Trigger.COMMAND],
        dependencies: [Dependency.CHAT],
        description: "Returns list of chat commands"
    },
    {
        id: "CHANGE_USER_SCENE",
        name: "Change User Scene",
        triggers: [Trigger.COMMAND, Trigger.CUSTOM_SCRIPT, Trigger.API, Trigger.HOTKEY],
        dependencies: [Dependency.INTERACTIVE, Dependency.CHAT],
        description: "Changes interactive scene for command user"
    },
    {
        id: "CHANGE_GROUP_SCENE",
        name: "Change Group Scene",
        triggers: [Trigger.COMMAND, Trigger.CUSTOM_SCRIPT, Trigger.API, Trigger.MANUAL, Trigger.HOTKEY],
        dependencies: [Dependency.INTERACTIVE, Dependency.CHAT],
        description: "Changes scene for interactive group"
    },
    {
        id: "UPDATE_BUTTON",
        name: "Update Button",
        triggers: ALL_TRIGGERS,
        dependencies: [Dependency.INTERACTIVE],
        description: "Update properties on a button"
    },
    {
        id: "TOGGLE_CONNECTION",
        name: "Toggle Connection",
        triggers: ALL_TRIGGERS,
        dependencies: [],
        description: "Toggles Firebot's connection to Mixer services"
    },
    {
        id: "SHOW_TEXT",
        name: "Show Text",
        triggers: ALL_TRIGGERS,
        dependencies: [Dependency.OVERLAY],
        description: "Displays formattable text in the overlay."
    }
];

function getEffects(triggerType) {
    // filter effects list to given triggerType
    let filteredEffects = effectDefinitions.filter((e) => {
        if (triggerType != null) {
            return e.triggers.includes(triggerType);
        }
        return true;
    });
    return filteredEffects;
}

function generateEffectObjects(triggerType) {
    let effectsObject = {};
    let filteredEffects = getEffects(triggerType);
    filteredEffects.forEach((e) => {
        effectsObject[e.id] = e.name;
    });
    return effectsObject;
}

function getEffectByName(effectName) {
    let effect = effectDefinitions.filter((e) => e.name === effectName);
    if (effect.length < 1) {
        return null;
    }
    return effect[0];
}

function getEffectById(effectId) {
    let effect = effectDefinitions.filter((e) => e.id === effectId);
    if (effect.length < 1) {
        return null;
    }
    return effect[0];
}

function getTriggerTypesForEffect(effectName) {
    let effect = getEffectByName(effectName);
    if (effect == null) {
        return null;
    }
    return effect.triggers;
}

function getDependenciesForEffect(effectName) {
    let effect = getEffectByName(effectName);
    if (effect == null) {
        return null;
    }
    return effect.dependencies;
}

// Generate 'Enum' objects for all effects
let EffectType = generateEffectObjects();

//export types
exports.DependencyType = Dependency;
exports.TriggerType = Trigger;
exports.EffectType = EffectType;

//export helper functions
exports.getEffectDefinitions = getEffects;
exports.getTriggerTypesForEffect = getTriggerTypesForEffect;
exports.getEffectByName = getEffectByName;
exports.getDependenciesForEffect = getDependenciesForEffect;
exports.getEffectById = getEffectById;

exports.effectCanBeTriggered = function(effectName, triggerType) {
    let triggerTypes = getTriggerTypesForEffect(effectName);
    if (triggerTypes == null) return false;

    return triggerTypes.includes(triggerType);
};

exports.getEffectDictionary = generateEffectObjects;

exports.getAllEffectTypes = function(triggerType) {
    // if triggerType is null, all effects are returned
    let effects = getEffects(triggerType);

    //map to just an array of names and return
    return effects.map(e => e.name);
};

exports.getEffect = function(effectIdOrName) {
    let effects = effectDefinitions.filter((e) => e.id === effectIdOrName || e.name === effectIdOrName);

    if (effects.length < 1) {
        return null;
    }

    return effects[0];
};
