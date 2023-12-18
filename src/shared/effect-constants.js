"use strict";

/**
 * Enum for effect categories.
 * @readonly
 * @enum {string}
 */
const EffectCategory = Object.freeze({
    COMMON: "common",
    TWITCH: "twitch",
    CHAT_BASED: "chat based",
    MODERATION: "Moderation",
    OVERLAY: "overlay",
    FUN: "fun",
    INTEGRATIONS: "integrations",
    ADVANCED: "advanced",
    SCRIPTING: "scripting"
});

/**
 * Enum for effect triggers.
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
    QUICK_ACTION: "quick_action",
    ALL: "all"
});

/**
 * Enum for effect dependencies.
 * @readonly
 * @enum {string}
 */
const EffectDependency = Object.freeze({
    CHAT: "chat",
    /**
     * @deprecated This does nothing
     */
    OVERLAY: "overlay"
});

exports.EffectCategory = EffectCategory;
exports.EffectTrigger = EffectTrigger;
exports.EffectDependency = EffectDependency;