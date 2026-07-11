"use strict";

/**
 * Enum for community plugin categories.
 * @readonly
 * @enum {string}
 */
const PluginCategory = Object.freeze({
    CHAT_AND_COMMANDS: "chat-commands",
    ALERTS_AND_EVENTS: "alerts-events",
    OVERLAY_WIDGETS: "overlay-widgets",
    INTEGRATIONS: "integrations",
    GAMES_AND_FUN: "games-fun",
    EFFECTS_AND_VARIABLES: "effects-variables",
    UTILITIES: "utilities"
});

/**
 * Display labels for community plugin categories.
 * @readonly
 */
const PluginCategoryLabels = Object.freeze({
    [PluginCategory.CHAT_AND_COMMANDS]: "Chat & Commands",
    [PluginCategory.ALERTS_AND_EVENTS]: "Alerts & Events",
    [PluginCategory.OVERLAY_WIDGETS]: "Overlay Widgets",
    [PluginCategory.INTEGRATIONS]: "Integrations",
    [PluginCategory.GAMES_AND_FUN]: "Games & Fun",
    [PluginCategory.EFFECTS_AND_VARIABLES]: "Effects & Variables",
    [PluginCategory.UTILITIES]: "Utilities"
});

exports.PluginCategory = PluginCategory;
exports.PluginCategoryLabels = PluginCategoryLabels;
