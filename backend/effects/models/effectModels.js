"use strict";

/**
 * Enum for effect triggers
 * @readonly
 * @enum {string}
 */
const EffectTrigger = Object.freeze({
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

/**
 * Enum for effect dependancies
 * @readonly
 * @enum {string}
 */
const EffectDependency = Object.freeze({
    CHAT: "chat",
    OVERLAY: "overlay"
});

/** The manifest of an effect */
class EffectDefinition {
    /**
   * Create an EffectDefinition
   * @param {string} id The id of the effect
   * @param {string} name The display name of the effect
   * @param {string} description A short description of the effect
   * @param {string[]} tags An array of organizational tags that apply to this effect
   * @param {string[]} dependenies An array of EffectDependancys
   * @param {string[]} triggers An array of EffectTriggers
   */
    constructor(id, name, description, tags, dependenies, triggers) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.tags = tags;
        this.dependenies = dependenies;
        this.triggers = triggers;
    }
}

/** An effect that can be triggered in various ways by Firebot */
class Effect {
    /**
   * Creat an Effect
   * @class
   * @param {EffectDefinition} definition An EffectDefinition object definining this Effect
   * @param {string} [optionsTemplate] An HTML template string for this Effect's options. Can include Angular bindings.
   * @param {string} [optionsTemplateUrl] A url pointing to an html file to beused as the options for this Effect. Can be used in place of optionsTemplate
   * @param {function} optionsController The controller of the Options view in the front end
   * @param {function} onTriggerEvent The callback function whenever this function is triggered
   * @param {object} overlayExtension Overlay extension object NOTE: unused at this time
   */
    constructor(
        definition,
        optionsTemplate,
        optionsTemplateUrl,
        optionsController,
        onTriggerEvent,
        overlayExtension
    ) {
        this.definition = definition;
        this.optionsTemplate = optionsTemplate;
        this.optionsTemplateUrl = optionsTemplateUrl;
        this.optionsController = optionsController;
        this.onTriggerEvent = onTriggerEvent;
        this.overlayExtension = overlayExtension;
    }
}

exports.EffectTrigger = EffectTrigger;
exports.EffectDependency = EffectDependency;
exports.EffectDefinition = EffectDefinition;
exports.Effect = Effect;
