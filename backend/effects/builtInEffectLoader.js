"use strict";

const effectManager = require("./effectManager");

exports.loadEffects = () => {
    effectManager.registerEffect(require("./builtin/active-user-lists")); // No migration needed.
    effectManager.registerEffect(require("./builtin/ad-break")); // Converted for Twitch
    effectManager.registerEffect(require("./builtin/api")); // No migration needed.
    effectManager.registerEffect(require("./builtin/celebration")); // No migration needed.
    effectManager.registerEffect(require("./builtin/chat-feed-alert"));
    effectManager.registerEffect(require("./builtin/chat")); // Converted for Twitch.
    effectManager.registerEffect(require("./builtin/clear-chat"));
    effectManager.registerEffect(require('./builtin/clear-effects')); // No migration needed.
    effectManager.registerEffect(require('./builtin/clips')); // Converted for Twitch, needs Discord posts fixed.
    effectManager.registerEffect(require("./builtin/conditional-effects/conditional-effects")); // No migration needed.
    effectManager.registerEffect(require("./builtin/control-emulation")); // No migration needed.
    effectManager.registerEffect(require("./builtin/cooldown-command"));
    effectManager.registerEffect(require("./builtin/currency")); // No migration needed.
    effectManager.registerEffect(require('./builtin/custom-script')); // No migration needed.
    effectManager.registerEffect(require("./builtin/custom-variable")); // No migration needed.
    effectManager.registerEffect(require("./builtin/delay")); // No migration needed.
    effectManager.registerEffect(require("./builtin/delete-chat-message")); // Converted for Twitch
    effectManager.registerEffect(require("./builtin/dice")); // No migration needed.
    effectManager.registerEffect(require("./builtin/effect-group")); // No migration needed.
    effectManager.registerEffect(require("./builtin/file-writer")); // No migration needed.
    effectManager.registerEffect(require("./builtin/html")); // No migration needed.
    effectManager.registerEffect(require("./builtin/loop-effects")); // No migration needed.
    effectManager.registerEffect(require("./builtin/mark-all-activity-acknowledged"));
    effectManager.registerEffect(require("./builtin/moderator-ban"));
    effectManager.registerEffect(require("./builtin/moderator-mod"));
    effectManager.registerEffect(require("./builtin/moderator-purge"));
    effectManager.registerEffect(require("./builtin/moderator-timeout"));
    effectManager.registerEffect(require("./builtin/play-sound")); // No migration needed.
    effectManager.registerEffect(require("./builtin/play-video")); // No migration needed.
    effectManager.registerEffect(require("./builtin/random-effect")); // No migration needed.
    effectManager.registerEffect(require("./builtin/random-reddit-image")); // No migration needed.
    effectManager.registerEffect(require('./builtin/run-command')); // No migration needed.
    effectManager.registerEffect(require("./builtin/run-program")); // No migration needed.
    effectManager.registerEffect(require("./builtin/sequential-effect")); // No migration needed.
    effectManager.registerEffect(require("./builtin/set-user-metadata"));
    effectManager.registerEffect(require("./builtin/shoutout"));
    effectManager.registerEffect(require("./builtin/show-image")); // No migration needed.
    effectManager.registerEffect(require("./builtin/show-text")); // No migration needed.
    effectManager.registerEffect(require("./builtin/stop-effect-execution")); // No migration needed.
    effectManager.registerEffect(require("./builtin/stream-game"));
    effectManager.registerEffect(require("./builtin/stream-title"));
    effectManager.registerEffect(require("./builtin/text-to-speech")); // No migration needed.
    effectManager.registerEffect(require("./builtin/toggle-command"));
    effectManager.registerEffect(require("./builtin/toggle-connection"));
    effectManager.registerEffect(require("./builtin/toggle-event-set"));
    effectManager.registerEffect(require("./builtin/toggle-event"));
    effectManager.registerEffect(require("./builtin/toggle-timer"));
    effectManager.registerEffect(require("./builtin/update-channel-reward"));
    effectManager.registerEffect(require("./builtin/update-counter"));
    effectManager.registerEffect(require("./builtin/update-role")); // No migration needed.
    effectManager.registerEffect(require("./builtin/update-vip-role"));
};