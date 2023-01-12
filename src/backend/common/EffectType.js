"use strict";

const Trigger = {
    COMMAND: "command",
    CUSTOM_SCRIPT: "custom_script",
    API: "api",
    EVENT: "event",
    HOTKEY: "hotkey",
    TIMER: "timer",
    SCHEDULED_TASK: "scheduled_task",
    COUNTER: "counter",
    CHANNEL_REWARD: "channel_reward",
    MANUAL: "manual"
};

const ALL_TRIGGERS = Object.values(Trigger);

const Dependency = {
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
        id: "CHAT",
        v5Id: "firebot:chat",
        name: "Chat",
        triggers: ALL_TRIGGERS,
        dependencies: [Dependency.CHAT],
        description: "Send a message to chat"
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
        id: "COMMAND_LIST",
        v5Id: null,
        name: "Command List",
        triggers: [Trigger.COMMAND],
        dependencies: [Dependency.CHAT],
        description: "Returns list of chat commands"
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

function getEffects(triggerType) {
    // filter effects list to given triggerType
    const filteredEffects = effectDefinitions.filter(e => {
        if (triggerType != null) {
            return e.triggers[triggerType] != null && e.triggers[triggerType] !== false;
        }
        return true;
    });
    return filteredEffects;
}

function generateEffectObjects(triggerType, triggerMeta, useV5Ids = false) {
    const effectsObject = {};
    const filteredEffects = getEffects(triggerType, triggerMeta);
    filteredEffects.forEach(e => {
        effectsObject[e.id] = useV5Ids ? e.v5Id : e.name;
    });
    return effectsObject;
}

function getEffectByName(effectName) {
    const effect = effectDefinitions.filter(e => e.name === effectName);
    if (effect.length < 1) {
        return null;
    }
    return effect[0];
}

function getEffectById(effectId) {
    const effect = effectDefinitions.filter(e => e.id === effectId);
    if (effect.length < 1) {
        return null;
    }
    return effect[0];
}

function getTriggerTypesForEffect(effectName) {
    const effect = getEffectByName(effectName);
    if (effect == null) {
        return null;
    }
    return effect.triggers;
}

function getDependenciesForEffect(effectName) {
    const effect = getEffectByName(effectName);
    if (effect == null) {
        return null;
    }
    return effect.dependencies;
}

// Generate 'Enum' objects for all effects
const EffectType = generateEffectObjects();

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
    const triggerTypes = getTriggerTypesForEffect(effectName);
    if (triggerTypes == null) {
        return false;
    }

    return triggerTypes.includes(triggerType);
};

exports.getEffectDictionary = generateEffectObjects;

exports.getAllEffectTypes = function(triggerType, triggerMeta) {
    // if triggerType is null, all effects are returned
    const effects = getEffects(triggerType, triggerMeta);

    //map to just an array of names and return
    return effects.map(e => e.name);
};

exports.getEffect = function(effectIdOrName) {
    const effects = effectDefinitions.filter(
        e => e.id === effectIdOrName || e.name === effectIdOrName
    );

    if (effects.length < 1) {
        return null;
    }

    return effects[0];
};
