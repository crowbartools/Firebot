'use strict';

const logger = require('../logwrapper');

// Handlers
const apiHandler = require('./handlers/apiProcessor.js');
const chatHandler = require('./handlers/chatProcessor.js');
const celebration = require('./handlers/celebrationProcessor.js');
const media = require('./handlers/mediaProcessor.js');
const cdHandler = require('./handlers/cooldownProcessor.js');
const controlHandler = require('./handlers/game-controls/controlProcessor.js');
const changeGroupHandler = require('./handlers/changeGroupProcessor.js');
const changeSceneHandler = require('./handlers/changeSceneProcessor.js');
const customScriptHandler = require('./handlers/custom-scripts/customScriptProcessor.js');
const diceHandler = require('./handlers/diceProcessor.js');
const htmlHandler = require('./handlers/htmlProcessor.js');
const showEventsHandler = require('./handlers/showEventsProcessor.js');
const commandRouter = require("../chat/command-router");
const fileWriter = require("./handlers/fileWriterProcessor");
const clipHandler = require("./handlers/createClipProcessor");

// Chat Specific Handlers
const changeGroupSceneHandler = require('../chat/handlers/changeGroupScenesProcessor.js');
const changeUserSceneHandler = require('../chat/handlers/changeUserScenesProcessor.js');
const getGroupListHandler = require('../chat/handlers/getGroupListProcessor.js');
const getScenesListHandler = require('../chat/handlers/getScenesProcessor.js');

const EffectType = require('./EffectType.js');
const { DependencyType, TriggerType } = EffectType;
const Interactive = require('./mixer-interactive.js');
const Chat = require('./mixer-chat.js');

const EffectBuilder = require('./handlers/custom-scripts/effectsObjectBuilder');

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Connection Dependency Checker
// This returns true if all dependency checks pass. IE: If interactive is required and we're connected to interactive.
// NOTE: I don't know of a way to check for overlay status right now so this skips that check.
function validateEffectCanRun(effectType, triggerType) {
    let effectDefinition = EffectType.getEffect(effectType);

    // Validate trigger
    if (!effectDefinition.triggers.includes(triggerType)) {
        logger.info(`${effectType} cannot be triggered by: ${triggerType}`);
        return false;
    }

    // Validate Dependancies
    let interactiveStatus = Interactive.getInteractiveStatus();
    let chatStatus = Chat.getChatStatus();

    let validDeps = effectDefinition.dependencies.every(d => {
        if (d === DependencyType.INTERACTIVE) {
            return interactiveStatus;
        }

        if (d === DependencyType.CHAT) {
            return chatStatus;
        }

        if (d === DependencyType.CONSTELLATION) {
            // TODO: update to actually check state of constellation
            return true;
        }

        if (d === DependencyType.OVERLAY) {
            return true;
        }

        logger.info(`Unknown effect dependancy: ${d}`);
        return false;
    });

    return validDeps;
}

function runEffect(effect, trigger) {
    let runResult = {
        delayBeforeNextEffect: 0,
        waitingOnOtherEffects: null
    };

    // Set the effect list to look through from the EffectType.js file.
    let EffectTypeList = EffectType.getEffectDictionary(trigger.type);

    // For each effect, send it off to the appropriate handler.
    logger.debug(`Running ${effect.type} effect...`);
    switch (effect.type) {
    case EffectTypeList.API_BUTTON:
        apiHandler.go(effect);
        break;
    case EffectTypeList.CHANGE_GROUP:
        changeGroupHandler.go(effect, trigger);
        break;
    case EffectTypeList.CHANGE_USER_SCENE:
        changeUserSceneHandler.go(effect, trigger);
        break;
    case EffectTypeList.CHANGE_GROUP_SCENE:
        changeGroupSceneHandler.go(trigger);
        break;
    case EffectTypeList.CHANGE_SCENE:
        changeSceneHandler.go(effect);
        break;
    case EffectTypeList.CHAT:
        chatHandler.send(effect, trigger);
        break;
    case EffectTypeList.COOLDOWN:
        cdHandler.go(effect);
        break;
    case EffectTypeList.CELEBRATION:
        celebration.play(effect);
        break;
    case EffectTypeList.DICE:
        diceHandler.send(effect, trigger);
        break;
    case EffectTypeList.GAME_CONTROL:
        controlHandler.press('mousedown', effect);
        if (trigger.type === TriggerType.MANUAL) {
            controlHandler.press('mouseup', effect);
        }
        break;
    case EffectTypeList.GROUP_LIST:
        getGroupListHandler.go(trigger);
        break;
    case EffectTypeList.HTML:
        htmlHandler.show(effect, trigger);
        break;
    case EffectTypeList.SHOW_EVENTS:
        showEventsHandler.go(effect, trigger);
        break;
    case EffectTypeList.PLAY_SOUND:
        media.sound(effect);
        break;
    case EffectTypeList.SCENE_LIST:
        getScenesListHandler.go(trigger);
        break;
    case EffectTypeList.COMMAND_LIST:
        chatHandler.commandList(trigger);
        break;
    case EffectTypeList.SHOW_IMAGE:
        media.image(effect, trigger);
        break;
    case EffectTypeList.SHOW_VIDEO:
        media.video(effect);
        break;
    case EffectTypeList.SHOW_TEXT:
        media.text(effect, trigger);
        break;
    case EffectTypeList.TEXT_TO_FILE:
        fileWriter.run(effect, trigger);
        break;
    case EffectTypeList.CREATE_CLIP: {
        clipHandler.createClip(effect, trigger);
        break;
    }
    case EffectTypeList.CLEAR_EFFECTS:
        renderWindow.webContents.send('clearEffects', {});
        break;
    case EffectTypeList.EFFECT_GROUP:
    case EffectTypeList.RANDOM_EFFECT: {
        if (effect.effectList == null) {
            effect.effectList = [];
        }

        let effectList;
        if (effect.type === EffectTypeList.RANDOM_EFFECT) {
            let randomIndex = getRandomInt(0, effect.effectList.length - 1);
            let randomEffect = effect.effectList[randomIndex];
            effectList = [randomEffect];
        } else {
            effectList = effect.effectList;
        }

        let processEffectsRequest = {
            effects: EffectBuilder.buildEffects(effectList),
            trigger: trigger
        };

        // eslint-disable-next-line no-use-before-define
        runResult.waitingOnOtherEffects = processEffects(processEffectsRequest);
        break;
    }
    case EffectTypeList.CUSTOM_SCRIPT:
        try {
            logger.debug("processing script");
            customScriptHandler.processScript(effect, trigger);
        } catch (err) {
            renderWindow.webContents.send('error', "Oops! There was an error processing the custom script. Error: " + err);
            logger.error(err);
        }
        break;
    case EffectTypeList.RUN_COMMAND: {
        let commandsCache = Chat.getCommandCache();

        let savedCommand = commandsCache.Active[effect.id];

        if (savedCommand == null) {
            savedCommand = commandsCache.Inactive[effect.id];
        }

        if (savedCommand != null) {
            let userCommand = {
                cmd: { value: savedCommand.trigger },
                args: effect.args ? effect.args : []
            };

            commandRouter.processChatEffects(
                effect.sender ? effect.sender : trigger.metadata.username,
                false,
                savedCommand,
                null,
                null,
                userCommand,
                false);
        }
        break;
    }
    case EffectTypeList.DELAY:
        runResult.delayBeforeNextEffect = effect.delay * 1000;
        break;
    case EffectTypeList.UPDATE_BUTTON:
        if (effect != null && effect.control != null && effect.properties != null) {
            Interactive.updateButtonProperties(effect.control.controlId, effect.properties, trigger);
        }
        break;
    case EffectTypeList.TOGGLE_CONNECTION:
        renderWindow.webContents.send('toggleServicesRequest', effect.services);
        break;
    default:
        renderWindow.webContents.send('error', "Oops! This effect type doesnt exist: " + effect.type);
        logger.error('Oops! This effect type doesnt exist: ' + effect.type);
    }
    return runResult;
}

function runEffects(runEffectsContext, callback) {
    let trigger = runEffectsContext.trigger,
        effects = runEffectsContext.effects;

    let currentIndex = runEffectsContext.previousIndex + 1;
    let effectsCount = Object.keys(effects).length;

    if (effectsCount < currentIndex) {
        callback();
        return;
    }

    let effect = effects[currentIndex.toString()];

    let runResult = {};
    // Check this effect for dependencies before running.
    // If all dependencies are not fulfilled, we will skip this effect.
    if (validateEffectCanRun(effect.type, trigger.type)) {
        runResult = runEffect(effect, trigger);
    } else {
        logger.info('Skipping ' + effect.type + '. Dependencies not met or trigger not supported.');
        renderWindow.webContents.send('eventlog', {type: "general", username: "System:", event: `Skipped over ${effect.type} due to dependencies or unsupported trigger.`});
    } // End dependency check

    // Update context object
    runEffectsContext.previousIndex = currentIndex;

    // Run the next effect
    if (runResult.waitingOnOtherEffects != null) {
        runResult.waitingOnOtherEffects.then(() => {
            // eslint-disable-next-line no-use-before-define
            delayNextEffectRun(runResult.delayBeforeNextEffect, runEffectsContext, callback);
        });
    } else {
        // eslint-disable-next-line no-use-before-define
        delayNextEffectRun(runResult.delayBeforeNextEffect, runEffectsContext, callback);
    }
}

function delayNextEffectRun(delayBeforeNextEffect = 0, runEffectsContext, callback) {
    // Run the next effect
    if (delayBeforeNextEffect === 0) {
        runEffects(runEffectsContext, callback);
    } else {
        setTimeout(function() {
            runEffects(runEffectsContext, callback);
        }, delayBeforeNextEffect);
    }
}

function processEffects(processEffectsRequest) {
    return new Promise((resolve) => {

        let username = "";
        if (processEffectsRequest.participant) {
            username = processEffectsRequest.participant.username;
        }

        // Add some values to our wrapper
        let runEffectsContext = processEffectsRequest;
        runEffectsContext["previousIndex"] = 0;
        runEffectsContext["username"] = username;

        runEffects(runEffectsContext, function() {
            resolve();
        });
    });
}

exports.processEffects = processEffects;
