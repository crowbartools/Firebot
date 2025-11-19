"use strict";

const { EffectManager } = require("./effect-manager");

exports.loadEffects = () => {
    [
        'active-user-lists',
        'activity-feed-alert',
        'add-quote',
        'api',
        'celebration',
        'chat-feed-alert',
        'chat-feed-custom-highlight',
        'chat-feed-message-hide',
        'chat',
        'clear-chat',
        'clear-effects',
        'clips',
        'conditional-effects/conditional-effects',
        'conditional-effects/switch-statement',
        'comment',
        'control-emulation', // No migration needed.
        'cooldown-command',
        'copy-to-clipboard',
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
        'overlay-alert',
        'random-effect',
        'random-reddit-image',
        'remove-user-metadata',
        'reset-timer',
        'retrigger-last-activity',
        'run-command',
        'run-program',
        'send-custom-websocket-event',
        'sequential-effect',
        'set-user-metadata',
        'shoutout',
        'show-image', // No migration needed.
        'show-text',
        'show-toast',
        'stop-effect-execution',
        'sync-profile-data',
        'take-screenshot',
        'text-to-speech',
        'toggle-command',
        'toggle-connection',
        'toggle-event-set',
        'toggle-event',
        'toggle-overlay-widgets',
        'toggle-scheduled-task',
        'toggle-timer',
        'trigger-manual-effect-queue',
        'update-channel-reward',
        'update-counter',
        'update-role',
        'update-viewer-rank',

        'overlay-widgets/update-overlay-widget-settings',
        'overlay-widgets/update-progress-bar',
        'overlay-widgets/update-dynamic-countdown',
        'overlay-widgets/set-custom-widget-state',
        'overlay-widgets/send-message-to-custom-widget'
    ].forEach((filename) => {
        const definition = require(`./builtin/${filename}`);
        EffectManager.registerEffect(definition);
    });

    // Twitch effects
    [
        'ad-break',
        'announcement',
        'approve-reject-channel-reward-redemption',
        'block-unblock',
        'create-stream-marker',
        'raid',
        'set-chat-mode',
        'shield-mode',
        'shoutout',
        'snooze-ad-break',
        'stream-title',
        'stream-game',

        'create-poll',
        'end-poll',

        'cancel-prediction',
        'create-prediction',
        'lock-prediction',
        'resolve-prediction',
        'update-vip-role'
    ].forEach((filename) => {
        const definition = require(`../streaming-platforms/twitch/effects/${filename}`);
        EffectManager.registerEffect(definition);
    });
};
