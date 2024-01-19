"use strict";

const replaceVariableManager = require("./replace-variable-manager");

exports.loadReplaceVariables = () => {
    [
        'active-chat-user-count',
        'command-trigger',
        'currency-name',
        'currency-rank',
        'currency',
        'date',
        'discord-timestamp',
        'effect-output',
        'effect-queue-id',
        'effect-queue-name',
        'new-currency-amount',
        'overlay-instance',
        'preset-list-arg',
        'previous-currency-amount',
        'profile-page-bytebin-token',
        'quote',
        'quote-as-object',
        'quote-as-raw-object',
        'random-advice',
        'random-custom-role-user',
        'random-dad-joke',
        'random-reddit-image',
        'roll-dice',
        'target',
        'time',
        'top-currency-raw',
        'top-currency-user',
        'top-currency',
        'top-metadata-raw',
        'top-metadata-user',
        'top-metadata',
        'top-view-time-raw',
        'top-view-time',
        'uptime',
        'view-time'
    ].forEach((filename) => {
        const definition = require(`./builtin/${filename}`);
        replaceVariableManager.registerReplaceVariable(definition);
    });
};