'use strict';
const mixerChat = require('../../../chat/chat');
const profileManager = require("../../profile-manager");
const settings = require('../../settings-access').settings;
const path = require('path');
const logger = require('../../../logwrapper');
const {
    ipcMain,
    shell,
    app
} = require('electron');

const effectRunner = require('../../effect-runner.js');
const accountAccess = require('../../account-access');
const uuidv1 = require("uuid/v1");
const mixerApi = require("../../../mixer-api/api");

function getUserRoles(participant) {
    return new Promise(async resolve => {
        if (participant == null || participant.userID == null) {
            return resolve([]);
        }
        const user = await mixerApi.chats.getUserInChat(participant.userID);
        resolve(user ? user.userRoles : []);
    });
}

//v4 effect types are keys, supported v5 types are values
const v4EffectTypeMap = {
    "API Button": "firebot:api",
    "Celebration": "firebot:celebration",
    "Change Group": null,
    "Change Scene": null,
    "Chat": "firebot:chat",
    "Cooldown": null,
    "Custom Script": "firebot:customscript",
    "Run Command": null,
    "Delay": "firebot:delay",
    "Dice": "firebot:dice",
    "Game Control": "firebot:controlemulation",
    "HTML": "firebot:html",
    "Show Event": null,
    "Play Sound": "firebot:playsound",
    "Random Effect": "firebot:randomeffect",
    "Effect Group": "firebot:run-effect-list",
    "Show Image": "firebot:showImage",
    "Create Clip": "firebot:clip",
    "Show Video": "firebot:playvideo",
    "Clear Effects": null,
    "Write Text To File": "firebot:filewriter",
    "Group List": null,
    "Scene List": null,
    "Command List": null,
    "Change User Scene": null,
    "Change Group Scene": null,
    "Update Button": null,
    "Toggle Connection": "firebot:toggleconnection",
    "Show Text": "firebot:showtext"
};

function scriptProcessor(effect, trigger) {
    return new Promise(resolve => {
        let scriptName = effect.scriptName,
            parameters = effect.parameters,
            control = trigger.metadata.control,
            userCommand = trigger.metadata.userCommand,
            participant = trigger.metadata.participant;

        logger.debug("running scrpt: " + scriptName);

        if (!settings.isCustomScriptsEnabled()) {
            renderWindow.webContents.send("error", "Something attempted to run a custom script but this feature is disabled!");
            return resolve();
        }

        let username = trigger.metadata.username;

        let scriptsFolder = profileManager.getPathInProfile("/scripts");
        let scriptFilePath = path.resolve(scriptsFolder, scriptName);
        // Attempt to load the script
        try {
            // Make sure we first remove the cached version, incase there was any changes
            if (settings.getClearCustomScriptCache()) {
                delete require.cache[require.resolve(scriptFilePath)];
            }

            let customScript = require(scriptFilePath);

            // Verify the script contains the "run" function
            if (typeof customScript.run === "function") {
                setTimeout(function() {

                    let manifest = {
                        name: "Unknown Script",
                        version: "Unknown Version"
                    };

                    // set manifest values if they exist
                    if (customScript.getScriptManifest) {
                        let scriptManifest = customScript.getScriptManifest();
                        if (scriptManifest) {
                            manifest.name = scriptManifest.name || manifest.name;
                            manifest.version = scriptManifest.version || manifest.version;
                        }
                    }

                    let streamerName = accountAccess.getAccounts().streamer.username || "Unknown Streamer";
                    let appVersion = app.getVersion();

                    const request = require("request");

                    let customRequest = request.defaults({
                        headers: {
                            'User-Agent': `Firebot/${appVersion};CustomScript/${manifest.name}/${manifest.version};User/${streamerName}`
                        }
                    });

                    // safe guard: enforce our user-agent
                    customRequest.init = function init(options) {
                        if (options != null && options.headers != null) {
                            delete options.headers['User-Agent'];
                        }
                        customRequest.prototype.init.call(this, options);
                    };

                    // Build modules object
                    let modules = {
                        request: customRequest,
                        spawn: require('child_process').spawn,
                        childProcess: require('child_process'),
                        fs: require('fs-extra'),
                        path: require('path'),
                        JsonDb: require('node-json-db'),
                        moment: require('moment'),
                        logger: logger,
                        // thin chat shim for basic backworks compatibility
                        chat: {
                            smartSend: (...args) => {
                                mixerChat.sendChatMessage(...args);
                            },
                            deleteChat: (id) => {
                                mixerChat.deleteMessage(id);
                            }
                        },
                        mixerChat: mixerChat,
                        mixplay: require("../../../interactive/mixplay"),
                        utils: require("../../../utility")
                    };

                    //simpify parameters
                    let simpleParams = {};
                    if (parameters != null) {
                        Object.keys(parameters).forEach(k => {
                            let param = parameters[k];
                            if (param != null) {
                                simpleParams[k] = param.value == null && param.value !== ""
                                    ? param.default
                                    : param.value;
                            }
                        });
                    }

                    let runRequest = {
                        modules: modules,
                        control: control,
                        command: userCommand,
                        user: {
                            name: username
                        },
                        firebot: {
                            accounts: accountAccess.getAccounts(),
                            settings: {
                                webServerPort: settings.getWebServerPort()
                            },
                            currentInteractiveBoardId: settings.getLastBoardName(),
                            version: app.getVersion()
                        },
                        parameters: simpleParams,
                        trigger: trigger
                    };

                    let response = getUserRoles(participant)
                        .then(roles => {
                            runRequest.user.roles = roles;
                        })
                        .then(() => {
                            return customScript.run(runRequest);
                        });

                    if (response) {
                        // Add a check to verify the response is a Promise
                        // If so, call the closure and process the response.
                        // Otherwise, just do nothing.
                        if (response instanceof Promise) {
                            response.then(data => {

                                if (data) {
                                    let responseObject = data;

                                    if (responseObject.success === true) {
                                        if (typeof responseObject.callback !== "function") {
                                            responseObject.callback = () => {};
                                        }

                                        let effects = responseObject.effects;

                                        let effectsObject;
                                        if (effects && Array.isArray(effects)) {

                                            //filter out effects that do not have v5 types assigned
                                            effects = effects.filter(e => e.type != null && e.type !== "");
                                            effects = effects.map(e => {
                                                let mappedType = v4EffectTypeMap[e.type];
                                                if (mappedType != null) {
                                                    e.type = mappedType;
                                                }
                                                return e;
                                            });

                                            //generate id's for effects that dont have them
                                            effects = effects.map(e => {
                                                if (e.id == null) {
                                                    e.id = uuidv1();
                                                }
                                                return e;
                                            });

                                            effectsObject = {
                                                list: effects,
                                                id: uuidv1()
                                            };

                                        } else if (effects != null) {
                                            effectsObject = effects;
                                        }

                                        //Run effects if there are any
                                        if (effectsObject && effectsObject.list.length > 0) {

                                            let newTrigger = Object.assign({}, trigger);
                                            //newTrigger.type = TriggerType.CUSTOM_SCRIPT;

                                            // Create request wrapper
                                            let processEffectsRequest = {
                                                trigger: newTrigger,
                                                effects: effectsObject
                                            };

                                            effectRunner
                                                .processEffects(processEffectsRequest)
                                                .then(result => {
                                                    responseObject.callback("effects");
                                                    if (result != null && result.success === true) {
                                                        if (result.stopEffectExecution) {
                                                            return resolve({
                                                                success: true,
                                                                execution: {
                                                                    stop: true,
                                                                    bubbleStop: true
                                                                }
                                                            });
                                                        }
                                                    }
                                                    resolve(true);
                                                })
                                                .catch(err => {
                                                    logger.error("Error running effects for script", err);
                                                    resolve();
                                                });
                                        } else {
                                            resolve();
                                        }

                                    } else {
                                        logger.error("Script failed. Sending error.");
                                        logger.error(responseObject.errorMessage);
                                        renderWindow.webContents.send("error", "Custom script failed with the message: " + responseObject.errorMessage);
                                        resolve();
                                    }
                                }
                            });
                        }
                    } else {
                        resolve();
                    }
                }, 1);
            } else {
                renderWindow.webContents.send("error", `Error running '${scriptName}', script does not contain a visible run fuction.`);
                resolve();
            }
        } catch (err) {
            renderWindow.webContents.send("error", `Error loading the script '${scriptName}' \n\n ${err}`);
            logger.error(err);
            resolve();
        }
    });
}

// Opens the custom scripts folder
ipcMain.on("openScriptsFolder", function() {
    // We include "fakescript.js" as a workaround to make it open into the 'scripts' folder instead
    // of opening to the firebot root folder with 'scripts' selected.
    let scriptsFolder = profileManager.getPathInProfile("/scripts");

    shell.openItem(scriptsFolder);
});

exports.processScript = scriptProcessor;
