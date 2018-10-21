'use strict';
const chat = require('../../mixer-chat.js');
const dataAccess = require('../../data-access.js');
const settings = require('../../settings-access').settings;
const path = require('path');
const logger = require('../../../logwrapper');
const {
    ipcMain,
    shell,
    app
} = require('electron');

const commandRouter = require('../../../chat/command-router');
const effectRunner = require('../../effect-runner.js');
const {EffectType, TriggerType } = require('../../EffectType.js');



function getUserRoles(participant) {
    return new Promise((resolve) => {
        if (participant != null && participant.userID != null) {
            chat.getUser(participant.userID, r => {
                if (r != null) {
                    resolve(r.body.userRoles);
                } else {
                    resolve([]);
                }
            });
        } else {
            resolve([]);
        }
    });
}

//runs all commands in a list recursively. It waits for the effects of each command to finish before running the next.
function runCommands(commandsList, index, commandsCache, username, firebotJson) {
    return new Promise(resolve => {
        if (index >= commandsList.length) {
            resolve();
        }

        let c = commandsList[index];

        let savedCommand = commandsCache.Active[c.id];

        if (savedCommand == null) {
            savedCommand = commandsCache.Inactive[c.id];
        }

        if (savedCommand != null) {

            let userCommand = {
                cmd: { value: savedCommand.trigger },
                args: c.args ? c.args : []
            };

            commandRouter.processChatEffects(c.sender ? c.sender : username, false, savedCommand, firebotJson, null, userCommand, false)
                .then(() => {
                    let newIndex = index + 1;
                    runCommands(commandsList, newIndex, commandsCache, username, firebotJson).then(resolve);
                });
        }
    });
}


function scriptProcessor(effect, trigger) {


    let scriptName = effect.scriptName,
        parameters = effect.parameters,
        control = trigger.metadata.control,
        userCommand = trigger.metadata.userCommand,
        participant = trigger.metadata.participant,
        triggerType = trigger.type;

    logger.debug("running scrpt: " + scriptName);

    if (!settings.isCustomScriptsEnabled()) {
        renderWindow.webContents.send('error', "Something attempted to run a custom script but this feature is disabled!");
        return;
    }

    let button = control;
    let username = trigger.metadata.username;

    let scriptsFolder = dataAccess.getPathInUserData('/user-settings/scripts');
    let scriptFilePath = path.resolve(scriptsFolder, scriptName);
    // Attempt to load the script
    try {
    // Make sure we first remove the cached version, incase there was any changes
        if (settings.getClearCustomScriptCache()) {
            delete require.cache[require.resolve(scriptFilePath)];
        }

        let customScript = require(scriptFilePath);

        // Verify the script contains the "run" function
        if (typeof customScript.run === 'function') {

            setTimeout(function() {

                // Build modules object
                let modules = {
                    request: require('request'),
                    spawn: require('child_process').spawn,
                    childProcess: require('child_process'),
                    fs: require('fs'),
                    path: require('path'),
                    JsonDb: require('node-json-db'),
                    moment: require('moment'),
                    logger: logger,
                    chat: chat,
                    interactive: require("../../mixer-interactive"),
                    utils: require("../../../utility")
                };

                let response;

                let isV2Script = customScript.run.length === 1;
                if (isV2Script) {

                    //simpify parameters
                    let simpleParams = {};
                    if (parameters != null) {
                        Object.keys(parameters).forEach((k) => {
                            let param = parameters[k];
                            if (param != null) {
                                simpleParams[k] = param.value == null && param.value !== "" ? param.default : param.value;
                            }
                        });
                    }

                    let accounts = {};
                    try {
                        accounts = dataAccess.getJsonDbInUserData("/user-settings/auth").getData("/");
                    } catch (err) {} // eslint-disable-line no-empty

                    let runRequest = {
                        modules: modules,
                        buttonId: button != null ? button.controlId : null, // only here for backwards compat
                        button: button != null ? {
                            name: button.controlId,
                            meta: button.meta || {}
                        } : null,
                        command: userCommand != null ? {
                            trigger: userCommand.cmd.value,
                            args: userCommand.args.filter(a => a != null && a !== "")
                        } : null,
                        username: username, // only here for backwards compat
                        user: {
                            name: username
                        },
                        firebot: {
                            accounts: accounts,
                            settings: {
                                webSocketPort: settings.getWebSocketPort(),
                                webServerPort: settings.getWebServerPort()
                            },
                            currentInteractiveBoardId: settings.getLastBoardName(),
                            version: app.getVersion()
                        },
                        parameters: simpleParams,
                        trigger: trigger,
                        triggerType: triggerType // only here for backwards compat
                    };

                    response = getUserRoles(participant).then(roles => {
                        runRequest.user.roles = roles;
                    }).then(() => {
                        return customScript.run(runRequest);
                    });

                } else {
                    response = customScript.run(button.controlId, username, modules);
                }

                if (response) {
                    // Add a check to verify the response is a Promise
                    // If so, call the closure and process the response.
                    // Otherwise, just do nothing.
                    if (response instanceof Promise) {
                        response.then((data) => {
                            if (isV2Script) {
                                /* In a V2 script, we are expecting a response like this:
                {
                   success: boolean,
                   errorMessage: string (optional),
                   effects: [
                    {
                      type: EffectType.CHAT,
                      message: "This is a chat message, yay.",
                      whisper: string (user name to whisper to),
                      chatter: string ("bot" or "streamer")
                    },
                    {
                      type: EffectType.PLAY_SOUND,
                      filepath: "c:\asdasd\asdasd\sound.mp3",
                      volume: 5
                    }
                  ],
                  callback: Function
                }
                */

                                if (data) {
                                    let responseObject = data;

                                    if (responseObject.success === true) {
                                        if (typeof responseObject.callback !== 'function') {
                                            responseObject.callback = () => {};
                                        }

                                        let effects = responseObject.effects;

                                        let builtEffects = {};
                                        let effectCount = 1;
                                        effects.forEach(e => {

                                            let type = e.type;
                                            if (type !== null &&
                                                    type !== undefined && type !== "" &&
                                                    Object.values(EffectType).includes(type)) {

                                                builtEffects[effectCount.toString()] = e;
                                            } else {
                                                renderWindow.webContents.send('error', "Custom script tried to execute an unknown or unsupported effect type: " + type);
                                            }

                                            effectCount++;
                                        });

                                        if (Object.keys(builtEffects).length > 0) {
                                            //Run effects if there are any

                                            let newTrigger = Object.assign({}, trigger);
                                            newTrigger.type = TriggerType.CUSTOM_SCRIPT;
                                            // Create request wrapper

                                            let processEffectsRequest = {
                                                trigger: newTrigger,
                                                effects: builtEffects
                                            };

                                            effectRunner.processEffects(processEffectsRequest)
                                                .then(() => {
                                                    responseObject.callback("effects");
                                                });
                                        }

                                        if (responseObject.commands != null && responseObject.commands.length > 0) {

                                            let commandsCache = chat.getCommandCache();

                                            runCommands(responseObject.commands, 0, commandsCache, username, null)
                                                .then(() => {
                                                    responseObject.callback("commands");
                                                });

                                        }
                                    } else {
                                        logger.error("Script failed. Sending error.");
                                        logger.error(responseObject.errorMessage);
                                        renderWindow.webContents.send('error', "Custom script failed with the message: " + responseObject.errorMessage);
                                    }
                                }
                            } else {
                                /*
                  Script V1 response data we are expecting is either nothing, or:
                  {
                   success: boolean,
                      - Whether or not the script was successful
                   message: string,
                      - Message either shown as an error or potentially sent in chat
                   chatAs: string or null
                      - If this is "bot" or "streamer", we chat the message as the given chatter
                   whisper: true or false/null
                      - If this is true and the above is set to chat as someone, this will whisper
                        to the participant instead
                  }
                */
                                if (data) {
                                    if (data.success === true && data.message) {
                                        let chatAs = data.chatAs;
                                        // We just need to check if chatAs is empty, everything else
                                        // is handled by te .whipser and .broadcast calls.
                                        if (chatAs) {
                                            if (data.whisper === true) {
                                                chat.whisper(chatAs, username, data.message);
                                            } else {
                                                chat.broadcast(chatAs, data.message);
                                            }
                                        }
                                    } else {
                                        renderWindow.webContents.send('error', "Custom script failed with the message: " + data.message);
                                    }
                                }
                            }
                        });
                    }
                }
            }, 1);
        } else {
            renderWindow.webContents.send('error', "Error running '" + scriptName + "', script does not contain a visible run fuction.");
        }
    } catch (err) {
        renderWindow.webContents.send('error', "Error loading the script '" + scriptName + "'\n\n" + err);
        logger.error(err);
    }
}

// Opens the custom scripts folder
ipcMain.on('openScriptsFolder', function() {
    // We include "fakescript.js" as a workaround to make it open into the 'scripts' folder instead
    // of opening to the firebot root folder with 'scripts' selected.
    let scriptsFolder = dataAccess.getPathInUserData("/user-settings/scripts/fakescript.js");

    shell.showItemInFolder(scriptsFolder);
});

exports.processScript = scriptProcessor;
