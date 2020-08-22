"use strict";

/**
 * The listener function that acts on event data
 *
 * @callback ListenerFunc
 * @param {any} data - data from the Constellation event
 * @returns {void}
 */

/**
 * A Constellation event listener
 * @typedef {Object} ConstellationListener
 * @property {string} event - The event to subscribe to, can possiblely contain a {streamerChannelId} variable which needs to be replaced
 * @property {ListenerFunc} callback
 */

/**@type {ConstellationListener[]} */
const listeners = [
    require("./listeners/adbreak-listener"),
    require("./listeners/channel-update-listener"),
    require("./listeners/follow-unfollow-listener"),
    require("./listeners/host-unhost-listener").hostListener,
    require("./listeners/host-unhost-listener").unhostListener,
    require("./listeners/patronage-listener"),
    require("./listeners/progression-levelup-listener"),
    require("./listeners/resub-listener"),
    require("./listeners/resub-shared-listener"),
    require("./listeners/skills-listener"),
    require("./listeners/sub-listener"),
    require("./listeners/gifted-sub-listener")
];
Object.freeze(listeners);

exports.listeners = listeners;
