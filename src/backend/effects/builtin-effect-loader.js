"use strict";

const effectManager = require("./effectManager");

exports.loadEffects = () => {
    [
        'active-user-lists',
        'ad-break',
        'add-quote',
        'announcement',
        'api',
        'celebration',
        'chat-feed-alert',
        'chat',
        'clear-chat',
        'clear-effects',
        'clips',
        'conditional-effects/conditional-effects',
        'control-emulation', // No migration needed.
        'cooldown-command',
        'create-stream-marker',
        'currency',
        'custom-script',
        'custom-variable',
        'delay',
        'delete-chat-message',
        'dice',
        'effect-group',
        'file-writer',
        'html',
        'http-request',
        'log-message',
        'loop-effects',
        'mark-all-activity-acknowledged',
        'moderator-ban',
        'moderator-mod',
        'moderator-purge',
        'moderator-timeout',
        'pause-resume-effect-queue',
        'play-sound',
        'play-video', // No migration needed.
        'raid',
        'random-effect',
        'random-reddit-image',
        'remove-user-metadata',
        'reset-timer',
        'run-command',
        'run-program',
        'sequential-effect',
        'set-chat-mode',
        'set-user-metadata',
        'shoutout',
        'show-image', // No migration needed.
        'show-text',
        'stop-effect-execution',
        'stream-game',
        'stream-title',
        'take-screenshot',
        'text-to-speech',
        'toggle-command',
        'toggle-connection',
        'toggle-event-set',
        'toggle-event',
        'toggle-timer',
        'update-channel-reward',
        'update-counter',
        'update-role',
        'update-vip-role'
    ].forEach(filename => {
        const definition = require(`./builtin/${filename}`);
        effectManager.registerEffect(definition);
    });
};
