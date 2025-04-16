"use strict";

const restrictionsManager = require("./restriction-manager");

exports.loadRestrictions = () => {
    [
        'active-chat-users',
        'channel-currency',
        'channel-game',
        'chat-messages',
        'custom-variable',
        'follow-check',
        'limit-per-stream',
        'permissions',
        'time-range',
        'view-time',
        'viewer-count'
    ].forEach((filename) => {
        const definition = require(`./builtin/${filename}.js`);
        restrictionsManager.registerRestriction(definition);
    });

};