"use strict";

const replaceVariableManager = require("./replace-variable-manager");

exports.loadReplaceVariables = () => {
    [
        'account-creation-date',
        'active-chat-user-count',
        'audio-duration',
        'bot',
        'category-image-url',
        'category',
        'command-trigger',
        'counter',
        'counter-change',
        'counter-maximum',
        'counter-minimum',
        'counter-name',
        'counter-new-value',
        'counter-previous-value',
        'currency-name',
        'currency-rank',
        'currency',
        'current-viewer-count',
        'custom-role-user-count',
        'custom-role-users-raw',
        'custom-role-users',
        'date',
        'discord-timestamp',
        'donation-amount-formatted',
        'donation-amount',
        'donation-from',
        'donation-message',
        'effect-output',
        'effect-queue-id',
        'effect-queue-name',
        'eval-vars',
        'follow-age',
        'follow-count',
        'game',
        'has-role',
        'has-roles',
        'is-whisper',
        'loop-count',
        'loop-item',
        'mod-reason',
        'moderator',
        'new-currency-amount',
        'overlay-instance',
        'poll-winning-choice-name',
        'poll-winning-choice-votes',
        'prediction-winning-outcome-name',
        'preset-list-arg',
        'previous-currency-amount',
        'profile-page-bytebin-token',
        'pronouns',
        'quote',
        'quote-as-object',
        'quote-as-raw-object',
        'raid-viewer-count',
        'random-active-viewer',
        'random-advice',
        'random-custom-role-user',
        'random-dad-joke',
        'random-reddit-image',
        'random-viewer',
        'roll-dice',
        'stream-title',
        'streamer',
        'target',
        'time',
        'timeout-duration',
        'top-currency-raw',
        'top-currency-user',
        'top-currency',
        'top-metadata-raw',
        'top-metadata-user',
        'top-metadata',
        'top-view-time-raw',
        'top-view-time',
        'uptime',
        'user-avatar-url',
        'user-badge-urls',
        'user-exists',
        'user-id-name',
        'user-id',
        'user-is-banned',
        'user-is-timed-out',
        'user-metadata-raw',
        'user-metadata',
        'user-roles-raw',
        'user-roles',
        'username-array-raw',
        'username-array',
        'video-duration',
        'view-time',
        'viewer-count',
        'whisper-message',
        'whisper-recipient',

        'twitch/twitch-channel-url'
    ].forEach((filename) => {
        const definition = require(`./builtin/${filename}`);
        replaceVariableManager.registerReplaceVariable(definition);
    });
};