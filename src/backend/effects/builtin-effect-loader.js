"use strict";

const effectManager = require("./effectManager");

exports.loadEffects = () => {
    [
        'active-user-lists',
        'activity-feed-alert',
        'add-quote',
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
        'currency',
        'custom-script',
        'custom-variable',
        'delay',
        'delete-chat-message',
        'dice',
        'effect-group',
        'eval-js',
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
        'random-effect',
        'random-reddit-image',
        'remove-user-metadata',
        'reset-timer',
        'run-command',
        'run-program',
        'send-custom-websocket-event',
        'sequential-effect',
        'set-user-metadata',
        'shoutout',
        'show-image', // No migration needed.
        'show-text',
        'stop-effect-execution',
        'take-screenshot',
        'text-to-speech',
        'toggle-command',
        'toggle-connection',
        'toggle-event-set',
        'toggle-event',
        'toggle-scheduled-task',
        'toggle-timer',
        'update-channel-reward',
        'update-counter',
        'update-role',
        'update-viewer-rank',

        'twitch/ad-break',
        'twitch/announcement',
        'twitch/approve-reject-channel-reward-redemption',
        'twitch/block-unblock',
        'twitch/create-stream-marker',
        'twitch/raid',
        'twitch/set-chat-mode',
        'twitch/shoutout',
        'twitch/snooze-ad-break',
        'twitch/stream-title',
        'twitch/stream-game',

        'twitch/create-poll',
        'twitch/end-poll',

        'twitch/cancel-prediction',
        'twitch/create-prediction',
        'twitch/lock-prediction',
        'twitch/resolve-prediction',
        'twitch/update-vip-role'
    ].forEach((filename) => {
        const definition = require(`./builtin/${filename}`);
        effectManager.registerEffect(definition);
    });
};
