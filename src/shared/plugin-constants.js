"use strict";

/**
 * Enum for community plugin categories.
 * @readonly
 * @enum {string}
 */
const PluginCategory = Object.freeze({
    STREAM_SERVICES: "stream-services",
    SOCIAL: "social",
    MUSIC_AND_MEDIA: "music-media",
    GAMES: "games",
    OVERLAYS: "overlays",
    TOOLS_AND_UTILITIES: "tools-utilities"
});

/**
 * Display labels for community plugin categories.
 * @readonly
 */
const PluginCategoryLabels = Object.freeze({
    [PluginCategory.STREAM_SERVICES]: "Stream Services",
    [PluginCategory.SOCIAL]: "Social",
    [PluginCategory.MUSIC_AND_MEDIA]: "Music & Media",
    [PluginCategory.GAMES]: "Games/Gaming",
    [PluginCategory.OVERLAYS]: "Overlays",
    [PluginCategory.TOOLS_AND_UTILITIES]: "Tools & Utilities"
});

/**
 * Enum for Firebot features a community plugin can provide.
 * @readonly
 * @enum {string}
 */
const PluginFeature = Object.freeze({
    EFFECTS: "effects",
    EVENTS: "events",
    VARIABLES: "variables",
    INTEGRATIONS: "integrations",
    OVERLAY_WIDGETS: "overlay-widgets",
    GAMES: "games",
    COMMANDS: "commands",
    UI_EXTENSIONS: "ui-extensions"
});

/**
 * Display labels for community plugin features.
 * @readonly
 */
const PluginFeatureLabels = Object.freeze({
    [PluginFeature.EFFECTS]: "Effects",
    [PluginFeature.EVENTS]: "Events",
    [PluginFeature.VARIABLES]: "Variables",
    [PluginFeature.INTEGRATIONS]: "Integrations",
    [PluginFeature.OVERLAY_WIDGETS]: "Overlay Widgets",
    [PluginFeature.GAMES]: "Games",
    [PluginFeature.COMMANDS]: "Commands",
    [PluginFeature.UI_EXTENSIONS]: "UI Extensions"
});

exports.PluginCategory = PluginCategory;
exports.PluginCategoryLabels = PluginCategoryLabels;
exports.PluginFeature = PluginFeature;
exports.PluginFeatureLabels = PluginFeatureLabels;
