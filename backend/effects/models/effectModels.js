"use strict";

const { InputEvent } = require("../../interactive/constants/MixplayConstants");

/**
   * @typedef EffectDefinition
   * @property {string} id The id of the Effect
   * @property {string} name The display name of the Effect
   * @property {string} description A short description of the Effect
   * @property {string} icon The Font Awesome name of the icon in front of the Effect
   * @property {string[]} categories An array of organizational categories that apply to this Effect
   * @property {string[]} dependencies An array of EffectDependencies
   * @property {string[]} [triggers] An array of EffectTriggers
   */

/**
   * @typedef Effect
   * @property {EffectDefinition} definition An EffectDefinition object definining this Effect
   * @property {string} [optionsTemplate] An HTML template string for this Effect's options. Can include Angular bindings.
   * @property {string} [optionsTemplateUrl] A url pointing to an html file to be used as this Effect's options. Can be used in place of optionsTemplate.
   * @property {function} optionsController The controller of the Options view in the front end
   * @property {function} optionsValidator The function that validates the user input
   * @property {function} onTriggerEvent The callback function whenever this function is triggered
   * @property {object} [overlayExtension] Overlay extension object NOTE: unused at this time
   */

/**
 * Enum for effect triggers
 * @readonly
 * @enum {string}
 */
const EffectTrigger = Object.freeze({
    INTERACTIVE: "interactive",
    COMMAND: "command",
    CUSTOM_SCRIPT: "custom_script",
    STARTUP_SCRIPT: "startup_script",
    API: "api",
    EVENT: "event",
    HOTKEY: "hotkey",
    TIMER: "timer",
    COUNTER: "counter",
    PRESET_LIST: "preset",
    CHANNEL_REWARD: "channel_reward",
    MANUAL: "manual",
    ALL: "all"
});

function buildNonInteractiveTriggers(otherTriggers) {
    let object = {};

    if (otherTriggers == null) {
        return object;
    }

    let triggers = [];
    if (otherTriggers === EffectTrigger.ALL ||
        (Array.isArray(otherTriggers) && otherTriggers.includes(EffectTrigger.ALL))) {
        triggers = Object.values(EffectTrigger).filter(t => t !== EffectTrigger.ALL && t !== EffectTrigger.INTERACTIVE);
    } else if (Array.isArray(otherTriggers)) {
        triggers = otherTriggers;
    }

    for (const trigger of triggers) {
        object[trigger] = true;
    }

    return object;
}
exports.buildEffectTriggersObject = function(mixplayControls, mixplayEvents, otherTriggers) {

    let triggersBase = buildNonInteractiveTriggers(otherTriggers);

    let mixplayTrigger = {
        controls: mixplayControls,
        events: mixplayEvents || [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT]
    };

    triggersBase[EffectTrigger.INTERACTIVE] = mixplayTrigger;

    return triggersBase;
};

/**
 * Enum for effect dependencies
 * @readonly
 * @enum {string}
 */
const EffectDependency = Object.freeze({
    CHAT: "chat",
    OVERLAY: "overlay"
});

exports.EffectTrigger = EffectTrigger;
exports.EffectDependency = EffectDependency;