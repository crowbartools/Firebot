"use strict";

const effectManager = require("./effectManager");

exports.loadEffects = () => {
    effectManager.registerEffect(require("./builtin/playSound"));
    effectManager.registerEffect(require("./builtin/chat"));
    effectManager.registerEffect(require("./builtin/chat-feed-alert"));
    effectManager.registerEffect(require("./builtin/api"));
    effectManager.registerEffect(require("./builtin/celebration"));
    effectManager.registerEffect(require("./builtin/clips"));
    effectManager.registerEffect(require("./builtin/dice"));
    effectManager.registerEffect(require("./builtin/fileWriter"));
    effectManager.registerEffect(require("./builtin/html"));
    effectManager.registerEffect(require("./builtin/playVideo")); // No migration needed.
    effectManager.registerEffect(require("./builtin/controlEmulation")); // No migration needed.
    effectManager.registerEffect(require("./builtin/showImage")); // No migration needed.
    effectManager.registerEffect(require("./builtin/showText"));
    effectManager.registerEffect(require("./builtin/delay"));
    effectManager.registerEffect(require("./builtin/randomEffect"));
    effectManager.registerEffect(require("./builtin/effectGroup"));
    effectManager.registerEffect(require("./builtin/currency"));
    effectManager.registerEffect(require("./builtin/randomRedditImage"));
    effectManager.registerEffect(require("./builtin/customVariable"));
    effectManager.registerEffect(require("./builtin/run-command"));
    effectManager.registerEffect(require("./builtin/customScript"));
    effectManager.registerEffect(require("./builtin/clearEffects"));
    effectManager.registerEffect(require("./builtin/sequentialEffect"));
    effectManager.registerEffect(require("./builtin/update-role"));
    effectManager.registerEffect(require("./builtin/update-vip-role"));
    effectManager.registerEffect(require("./builtin/conditional-effects/conditional-effects"));
    effectManager.registerEffect(require("./builtin/loopEffects"));
    effectManager.registerEffect(require("./builtin/text-to-speech"));
    effectManager.registerEffect(require("./builtin/delete-chat-message"));
    effectManager.registerEffect(require("./builtin/stop-effect-execution"));
    effectManager.registerEffect(require("./builtin/ad-break"));
    effectManager.registerEffect(require("./builtin/run-program"));
    effectManager.registerEffect(require("./builtin/activeUserLists"));
    effectManager.registerEffect(require("./builtin/stream-title"));
    effectManager.registerEffect(require("./builtin/stream-game"));
    effectManager.registerEffect(require("./builtin/moderatorBan"));
    effectManager.registerEffect(require("./builtin/moderatorPurge"));
    effectManager.registerEffect(require("./builtin/moderatorTimeout"));
    effectManager.registerEffect(require("./builtin/moderatorMod"));
    effectManager.registerEffect(require("./builtin/clearChat"));
    effectManager.registerEffect(require("./builtin/update-counter"));
    effectManager.registerEffect(require("./builtin/toggle-command"));
    effectManager.registerEffect(require("./builtin/toggleConnection"));
    effectManager.registerEffect(require("./builtin/toggle-event"));
    effectManager.registerEffect(require("./builtin/toggle-event-set"));
    effectManager.registerEffect(require("./builtin/toggle-timer"));
    effectManager.registerEffect(require("./builtin/cooldown-command"));
    effectManager.registerEffect(require("./builtin/set-user-metadata"));
    effectManager.registerEffect(require("./builtin/shoutout"));
    effectManager.registerEffect(require("./builtin/mark-all-activity-acknowledged"));
    effectManager.registerEffect(require("./builtin/update-channel-reward"));
    effectManager.registerEffect(require("./builtin/http-request"));
    effectManager.registerEffect(require("./builtin/take-screenshot"));
};
