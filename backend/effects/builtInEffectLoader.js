"use strict";

const effectManager = require("./effectManager");

exports.loadEffects = () => {
    // get effect definitions
    const playSoundEffect = require("./builtin/playSound");
    const chatEffect = require("./builtin/chat");
    const chatFeedAlert = require("./builtin/chat-feed-alert");
    const api = require("./builtin/api");
    const celebration = require("./builtin/celebration");
    const clips = require('./builtin/clips');
    const dice = require("./builtin/dice");
    const fileWriter = require("./builtin/fileWriter");
    const html = require("./builtin/html");
    const playVideo = require("./builtin/playVideo");
    const controlEmulation = require("./builtin/controlEmulation");
    const showImage = require("./builtin/showImage");
    const showText = require("./builtin/showText");
    const delay = require("./builtin/delay");
    const randomEffect = require("./builtin/randomEffect");
    const effectGroup = require("./builtin/effectGroup");
    const currency = require("./builtin/currency");
    const randomRedditImage = require("./builtin/randomRedditImage");
    const customVariable = require("./builtin/customVariable");
    const runCommand = require('./builtin/run-command');
    const customScript = require('./builtin/customScript');
    const clearEffects = require('./builtin/clearEffects');
    const sequentialEffect = require("./builtin/sequentialEffect");
    const updateRole = require("./builtin/update-role");
    const updateVipRole = require("./builtin/update-vip-role");
    const conditionalEffects = require("./builtin/conditional-effects/conditional-effects");
    const loopEffects = require("./builtin/loopEffects");
    const textToSpeech = require("./builtin/text-to-speech");
    const deleteChatMessage = require("./builtin/delete-chat-message");
    const stopEffectExecution = require("./builtin/stop-effect-execution");
    const adBreak = require("./builtin/ad-break");
    const runProgram = require("./builtin/run-program");
    const activeUserLists = require("./builtin/activeUserLists");
    const streamTitle = require("./builtin/stream-title");
    const streamGame = require("./builtin/stream-game");
    const moderatorBan = require("./builtin/moderatorBan");
    const moderatorPurge = require("./builtin/moderatorPurge");
    const moderatorTimeout = require("./builtin/moderatorTimeout");
    const moderatorMod = require("./builtin/moderatorMod");
    const clearChat = require("./builtin/clearChat");
    const updateCounter = require("./builtin/update-counter");
    const toggleCommand = require("./builtin/toggle-command");
    const toggleConnection = require("./builtin/toggleConnection");
    const toggleEvent = require("./builtin/toggle-event");
    const toggleEventSet = require("./builtin/toggle-event-set");
    const toggleTimer = require("./builtin/toggle-timer");
    const cooldownCommand = require("./builtin/cooldown-command");
    const setUserMetadata = require("./builtin/set-user-metadata");
    const shoutout = require("./builtin/shoutout");
    const markAllActivityAcknowledged = require("./builtin/mark-all-activity-acknowledged");

    // register them
    effectManager.registerEffect(playSoundEffect); // No migration needed.
    effectManager.registerEffect(chatEffect); // Converted for Twitch.
    effectManager.registerEffect(chatFeedAlert);
    effectManager.registerEffect(api); // No migration needed.
    effectManager.registerEffect(celebration); // No migration needed.
    effectManager.registerEffect(clips); // Converted for Twitch, needs Discord posts fixed.
    effectManager.registerEffect(dice); // No migration needed.
    effectManager.registerEffect(fileWriter); // No migration needed.
    effectManager.registerEffect(html); // No migration needed.
    effectManager.registerEffect(playVideo); // No migration needed.
    effectManager.registerEffect(controlEmulation); // No migration needed.
    effectManager.registerEffect(showImage); // No migration needed.
    effectManager.registerEffect(showText); // No migration needed.
    effectManager.registerEffect(delay); // No migration needed.
    effectManager.registerEffect(randomEffect); // No migration needed.
    effectManager.registerEffect(effectGroup); // No migration needed.
    effectManager.registerEffect(currency); // No migration needed.
    effectManager.registerEffect(randomRedditImage); // No migration needed.
    effectManager.registerEffect(customVariable); // No migration needed.
    effectManager.registerEffect(runCommand); // No migration needed.
    effectManager.registerEffect(customScript); // No migration needed.
    effectManager.registerEffect(clearEffects); // No migration needed.
    effectManager.registerEffect(sequentialEffect); // No migration needed.
    effectManager.registerEffect(updateRole); // No migration needed.
    effectManager.registerEffect(updateVipRole);
    effectManager.registerEffect(conditionalEffects); // No migration needed.
    effectManager.registerEffect(loopEffects); // No migration needed.
    effectManager.registerEffect(textToSpeech); // No migration needed.
    effectManager.registerEffect(deleteChatMessage); // Converted for Twitch
    effectManager.registerEffect(stopEffectExecution); // No migration needed.
    effectManager.registerEffect(adBreak); // Converted for Twitch
    effectManager.registerEffect(runProgram); // No migration needed.
    effectManager.registerEffect(activeUserLists); // No migration needed.
    effectManager.registerEffect(streamTitle);
    effectManager.registerEffect(streamGame);
    effectManager.registerEffect(moderatorBan);
    effectManager.registerEffect(moderatorPurge);
    effectManager.registerEffect(moderatorTimeout);
    effectManager.registerEffect(moderatorMod);
    effectManager.registerEffect(clearChat);
    effectManager.registerEffect(updateCounter);
    effectManager.registerEffect(toggleCommand);
    effectManager.registerEffect(toggleConnection);
    effectManager.registerEffect(toggleEventSet);
    effectManager.registerEffect(toggleEvent);
    effectManager.registerEffect(toggleTimer);
    effectManager.registerEffect(cooldownCommand);
    effectManager.registerEffect(setUserMetadata);
    effectManager.registerEffect(shoutout);
    effectManager.registerEffect(markAllActivityAcknowledged);
    effectManager.registerEffect(require("./builtin/update-channel-reward"));
};
