"use strict";

const Trigger = {
    INTERACTIVE: "interactive",
    COMMAND: "command",
    CUSTOM_SCRIPT: "custom_script",
    API: "api",
    EVENT: "event",
    HOTKEY: "hotkey",
    TIMER: "timer",
    COUNTER: "counter",
    CHANNEL_REWARD: "channel_reward",
    MANUAL: "manual"
};

const ALL_TRIGGERS = Object.values(Trigger);

const Dependency = {
    INTERACTIVE: "interactive",
    CHAT: "chat",
    OVERLAY: "overlay"
};

const effectDefinitions = [
    {
        id: "API_BUTTON",
        v5Id: "firebot:api",
        name: "API Button",
        triggers: ALL_TRIGGERS,
        dependencies: [Dependency.CHAT],
        description: "Pull info from third-party APIs"
    },
    {
        id: "CELEBRATION",
        v5Id: "firebot:celebration",
        name: "Celebration",
        triggers: ALL_TRIGGERS,
        dependencies: [Dependency.OVERLAY],
        description: "Fun effects in the overlay"
    },
    {
        id: "CHANGE_GROUP",
        v5Id: null,
        name: "Change Group",
        triggers: [
            Trigger.INTERACTIVE,
            Trigger.CUSTOM_SCRIPT,
            Trigger.API,
            Trigger.EVENT,
            Trigger.HOTKEY
        ],
        dependencies: [Dependency.INTERACTIVE],
        description: "Move a user to a new group"
    },
    {
        id: "CHANGE_SCENE",
        v5Id: null,
        name: "Change Scene",
        triggers: [
            Trigger.INTERACTIVE,
            Trigger.CUSTOM_SCRIPT,
            Trigger.API,
            Trigger.EVENT,
            Trigger.HOTKEY
        ],
        dependencies: [Dependency.INTERACTIVE],
        description: "Move a group to a new scene"
    },
    {
        id: "CHAT",
        v5Id: "firebot:chat",
        name: "Chat",
        triggers: ALL_TRIGGERS,
        dependencies: [Dependency.CHAT],
        description: "Send a message to chat"
    },
    {
        id: "COOLDOWN",
        v5Id: null,
        name: "Cooldown",
        triggers: [
            Trigger.INTERACTIVE,
            Trigger.CUSTOM_SCRIPT,
            Trigger.API,
            Trigger.COMMAND,
            Trigger.EVENT,
            Trigger.HOTKEY,
            Trigger.TIMER
        ],
        dependencies: [Dependency.INTERACTIVE],
        description: "Cooldown some buttons"
    },
    {
        id: "CUSTOM_SCRIPT",
        v5Id: "firebot:customscript",
        name: "Custom Script",
        triggers: ALL_TRIGGERS,
        dependencies: [],
        description: "Run your own script"
    },
    {
        id: "RUN_COMMAND",
        v5Id: null,
        name: "Run Command",
        triggers: [
            Trigger.CUSTOM_SCRIPT,
            Trigger.API,
            Trigger.MANUAL,
            Trigger.HOTKEY
        ],
        dependencies: [],
        description: "Run a command via another trigger"
    },
    {
        id: "DELAY",
        v5Id: "firebot:delay",
        name: "Delay",
        triggers: ALL_TRIGGERS,
        dependencies: [],
        description: "Pause between effects"
    },
    {
        id: "DICE",
        v5Id: "firebot:dice",
        name: "Dice",
        triggers: ALL_TRIGGERS,
        dependencies: [Dependency.CHAT],
        description: "Roll dice in chat"
    },
    {
        id: "GAME_CONTROL",
        v5Id: "firebot:controlemulation",
        name: "Game Control",
        triggers: ALL_TRIGGERS,
        dependencies: [],
        description: "Emulate keyboard and mouse clicks"
    },
    {
        id: "HTML",
        v5Id: "firebot:html",
        name: "HTML",
        triggers: ALL_TRIGGERS,
        dependencies: [Dependency.OVERLAY],
        description: "Display custom HTML in the overlay"
    },
    {
        id: "SHOW_EVENTS",
        v5Id: null,
        name: "Show Event",
        triggers: ALL_TRIGGERS,
        dependencies: [Dependency.OVERLAY],
        description: "Send an event to the Event List"
    },
    {
        id: "PLAY_SOUND",
        v5Id: "firebot:playsound",
        name: "Play Sound",
        triggers: ALL_TRIGGERS,
        dependencies: [],
        description: "Play a sound for listening pleasure"
    },
    {
        id: "RANDOM_EFFECT",
        v5Id: "firebot:randomeffect",
        name: "Random Effect",
        triggers: ALL_TRIGGERS,
        dependencies: [],
        description: "Run a random effect from a list of effects"
    },
    {
        id: "EFFECT_GROUP",
        v5Id: "firebot:run-effect-list",
        name: "Effect Group",
        triggers: ALL_TRIGGERS,
        dependencies: [],
        description:
      "Group multiple effects to be treated as one (good for Random Effect use)"
    },
    {
        id: "SHOW_IMAGE",
        v5Id: "firebot:showImage",
        name: "Show Image",
        triggers: ALL_TRIGGERS,
        dependencies: [Dependency.OVERLAY],
        description: "Display an image on the overlay"
    },
    {
        id: "CREATE_CLIP",
        v5Id: "firebot:clip",
        name: "Create Clip",
        triggers: ALL_TRIGGERS,
        dependencies: [],
        description: "Triggers a clip to be made on Mixer for a given duration."
    },
    {
        id: "SHOW_VIDEO",
        v5Id: "firebot:playvideo",
        name: "Show Video",
        triggers: ALL_TRIGGERS,
        dependencies: [Dependency.OVERLAY],
        description: "Play a video in the overlay"
    },
    {
        id: "CLEAR_EFFECTS",
        v5Id: null,
        name: "Clear Effects",
        triggers: ALL_TRIGGERS,
        dependencies: [],
        description: "Clear and stop any currently running effects (sounds and overlay effects)."
    },
    {
        id: "TEXT_TO_FILE",
        v5Id: "firebot:filewriter",
        name: "Write Text To File",
        triggers: ALL_TRIGGERS,
        dependencies: [],
        description: "Write customizable text to a file"
    },
    {
        id: "GROUP_LIST",
        v5Id: null,
        name: "Group List",
        triggers: [Trigger.COMMAND],
        dependencies: [Dependency.CHAT, Dependency.INTERACTIVE],
        description: "Returns list of interactive groups"
    },
    {
        id: "SCENE_LIST",
        v5Id: null,
        name: "Scene List",
        triggers: [Trigger.COMMAND],
        dependencies: [Dependency.INTERACTIVE, Dependency.CHAT],
        description: "Returns list of interactive scenes"
    },
    {
        id: "COMMAND_LIST",
        v5Id: null,
        name: "Command List",
        triggers: [Trigger.COMMAND],
        dependencies: [Dependency.CHAT],
        description: "Returns list of chat commands"
    },
    {
        id: "CHANGE_USER_SCENE",
        v5Id: null,
        name: "Change User Scene",
        triggers: [
            Trigger.COMMAND,
            Trigger.CUSTOM_SCRIPT,
            Trigger.API,
            Trigger.HOTKEY
        ],
        dependencies: [Dependency.INTERACTIVE, Dependency.CHAT],
        description: "Changes interactive scene for command user"
    },
    {
        id: "CHANGE_GROUP_SCENE",
        v5Id: null,
        name: "Change Group Scene",
        triggers: [
            Trigger.COMMAND,
            Trigger.CUSTOM_SCRIPT,
            Trigger.API,
            Trigger.MANUAL,
            Trigger.HOTKEY
        ],
        dependencies: [Dependency.INTERACTIVE, Dependency.CHAT],
        description: "Changes scene for interactive group"
    },
    {
        id: "UPDATE_BUTTON",
        v5Id: null,
        name: "Update Button",
        triggers: ALL_TRIGGERS,
        dependencies: [Dependency.INTERACTIVE],
        description: "Update properties on a button"
    },
    {
        id: "TOGGLE_CONNECTION",
        v5Id: "firebot:toggleconnection",
        name: "Toggle Connection",
        triggers: ALL_TRIGGERS,
        dependencies: [],
        description: "Toggles Firebot's connection to Mixer services"
    },
    {
        id: "SHOW_TEXT",
        v5Id: "firebot:showtext",
        name: "Show Text",
        triggers: ALL_TRIGGERS,
        dependencies: [Dependency.OVERLAY],
        description: "Displays formattable text in the overlay."
    }
];

function getEffects(triggerType, triggerMeta) {
    // filter effects list to given triggerType
    let filteredEffects = effectDefinitions.filter(e => {
        if (triggerType != null) {
            let supported = e.triggers[triggerType] != null && e.triggers[triggerType] !== false;
            if (!supported) return false;


            if (triggerMeta) {
                const triggerData = e.triggers[triggerType];
                switch (triggerType) {
                case Trigger.INTERACTIVE:
                    return triggerData.controls.includes(triggerData.control);
                default:
                    return true;
                }
            } else {
                return true;
            }
        }
        return true;
    });
    return filteredEffects;
}

function generateEffectObjects(triggerType, triggerMeta, useV5Ids = false) {
    let effectsObject = {};
    let filteredEffects = getEffects(triggerType, triggerMeta);
    filteredEffects.forEach(e => {
        effectsObject[e.id] = useV5Ids ? e.v5Id : e.name;
    });
    return effectsObject;
}

function getEffectByName(effectName) {
    let effect = effectDefinitions.filter(e => e.name === effectName);
    if (effect.length < 1) {
        return null;
    }
    return effect[0];
}

function getEffectById(effectId) {
    let effect = effectDefinitions.filter(e => e.id === effectId);
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
exports.EffectTypeV5Map = generateEffectObjects(null, null, true);

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

exports.getAllEffectTypes = function(triggerType, triggerMeta) {
    // if triggerType is null, all effects are returned
    let effects = getEffects(triggerType, triggerMeta);

    //map to just an array of names and return
    return effects.map(e => e.name);
};

exports.getEffect = function(effectIdOrName) {
    let effects = effectDefinitions.filter(
        e => e.id === effectIdOrName || e.name === effectIdOrName
    );

    if (effects.length < 1) {
        return null;
    }

    return effects[0];
};
