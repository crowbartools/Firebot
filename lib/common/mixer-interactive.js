'use strict';

const {ipcMain} = require('electron');
const dataAccess = require('./data-access.js');
const Controls = require('../interactive/control-router');
const Grouper = require('../interactive/auto-grouper');
const Cooldowns = require('../interactive/cooldowns.js');
const Threshold = require('../interactive/threshold.js');
const joystick = require('./handlers/game-controls/joystick');
const mathjs = require('mathjs');
const reconnectService = require('./reconnect.js');
const logger = require('../logwrapper');
const { LiveEvent, EventSourceType, EventType } = require('../live-events/EventType');
const eventsRouter = require('../live-events/events-router.js');
const util = require('../utility');
const cooldowns = require('../interactive/cooldowns');

// Setup mixer Interactive and make it a global variable for use throughout the app.
const interactive = require('beam-interactive-node2');
const ws = require('ws');

interactive.setWebSocket(ws);
let mixerClient = new interactive.GameClient();

// This holds the connection status of interactive.
let interactiveConnected = false;

// This holds the current interactive board json.
let interactiveCache = [];

// Helper function factory to bind events
function addControlHandlers(controls) {
    const addHandler = (control, event) => {
        control.on(event, (inputEvent, participant) => {
            logger.debug("Control event: " + event + " for control: ", inputEvent.input.controlID);
            Controls.router(event, controls, control, interactiveCache, inputEvent, participant);
        });
    };

    controls.forEach(control => {
        addHandler(control, 'mousedown');
        addHandler(control, 'mouseup');
        addHandler(control, 'keydown');
        addHandler(control, 'keyup');
        addHandler(control, 'submit');
        control.on('move', joystick.go);
    });
}
// Refresh Controls JSON Cache
function refreshInteractiveCache(retry) {

    // FB: I've set a weird retry thing here because I ran into a rare issue where upon saving settings the app tried to
    // save and get the same file at the same time which threw errors and caused the cache to get out
    // of sync.
    if (retry == null) {
        retry = 1;
    }

    // Get last board name.
    let dbSettings = dataAccess.getJsonDbInUserData("/user-settings/settings");

    try {
        let gameName = dbSettings.getData('/interactive/lastBoardId');

        if (!dataAccess.userDataPathExistsSync(`/user-settings/controls/${gameName}.json`)) {
            return;
        }

        // We've got the last used board! Let's update the interactive cache.
        if (gameName != null && retry <= 3) {
            try {
                // Get settings for last board.
                let dbControls = dataAccess.getJsonDbInUserData("/user-settings/controls/" + gameName);
                interactiveCache = dbControls.getData('/');
                logger.info('Updated interactive cache.');

            } catch (err) {
                logger.info(`Interactive cache update failed. Retrying. (Try ${retry++}/3)`);
                refreshInteractiveCache(retry);
            }
        } else {
            renderWindow.webContents.send('error', "Could not sync up interactive controls cache. Reconnect to try resyncing.");
        }
    } catch (err) {
        logger.debug("error while attempting to refresh interactive cache:", err.message);
    }
}

// Refresh immediately for manually testing buttons before connecting.
refreshInteractiveCache();

// Gets interactive cache
function getInteractiveCache() {
    return interactiveCache;
}

// Make All Scenes
// This will put handlers on each control.
function makeAllScenes() {
    return new Promise((resolve, reject) => {
        try {
            mixerClient.synchronizeScenes()
                .then(() => mixerClient.getScenes())
                .then((res) => {
                    res.scenes.forEach((scene) => {
                        logger.info('Scene Controls: ' + scene.sceneID);
                        addControlHandlers(mixerClient.state.getScene(scene.sceneID).getControls());
                        resolve(true);
                    });
                })
                .catch((err) => {
                    logger.error('Error syncing scenes', err);
                    reject(err);
                });
        } catch (err) {
            logger.error("error when attempting to sync scenes" + err);
            reject(err);
        }
    });
}

// Make Controls
// Gets the controls for a scene and builds the json for it.
function makeControls(sceneId) {
    try {
        let controls = [];
        let scenes = interactiveCache['mixer'];
        scenes.forEach(scene => {
            if (scene.sceneId === sceneId) {
                scene.controls.forEach(control => controls.push(control));
            }
        });
        return controls;
    } catch (err) {
        renderWindow.webContents.send('error', "There was an error creating your controls.");
        logger.error(err);
    }
}


// Make New Scene
function makeNewScene(sceneID) {
    return new Promise((resolve, reject) => {
        try {
            if (sceneID !== 'banned') {
                logger.info('Creating Scene Controls:' + sceneID);

                mixerClient.createScenes({
                    scenes: [{"sceneID": sceneID, "controls": makeControls(sceneID)}]

                // Bind event handlers to each control in the scene
                }).then(controls => {
                    addControlHandlers(controls);
                });
            } else {
                logger.info('Creating Scene Controls: ' + sceneID);
                mixerClient.createScenes({scenes: [{"sceneID": sceneID, "controls": []}]});
            }
            resolve(true);
        } catch (err) {
            logger.error("error when creating new scene " + sceneID, err);
            reject(err);
        }
    });
}

// Make All Groups
// This will build out all of the groups the app needs.
function makeAllGroups() {
    return new Promise((resolve, reject) => {
        try {
            let groups = [];

            let gameScenes = interactiveCache['firebot'].scenes;

            // Loop through scenes to see which groups are in use.
            for (let scene in gameScenes) {
                if (scene !== null && scene !== undefined) {
                    scene = gameScenes[scene];
                    let sceneName = scene.sceneName;
                    let groupList = scene.default;

                    // Loop through group list and push results to groups..
                    for (let item of groupList) {
                        // Don't need to make a default group as that is there anyway.
                        if (item !== "None") {
                            groups.push({groupID: item, sceneID: sceneName});
                        }
                    }
                }
            }

            // Add in banned user group
            groups.push({groupID: 'banned', sceneID: 'banned'});

            // Create all groups
            mixerClient.synchronizeScenes()
                .then(() =>
                    mixerClient.createGroups({groups: groups})
                ).then(() => {
                    resolve(true);
                });

        } catch (err) {
            logger.error("error when making all groups", err);
            reject(err);
        }
    });
}

// Change Groups
// This changes a single user from one group to another.
function changeGroups(participantInfo, groupidInfo) {
    const participant = participantInfo;
    const groupid = groupidInfo;

    if (groupid !== "None") {
        mixerClient.synchronizeGroups()
            .then(() => {
                logger.info('Changing user to group: ' + groupid + '.');
                let group = mixerClient.state.getGroup(groupid);
                if (group !== undefined) {
                    participant.groupID = groupid;
                    mixerClient.updateParticipants({participants: [participant]});
                } else {
                    renderWindow.webContents.send('error', "A button tried to change someone to a group:" + groupid + ". But, I couldnt get that group info from Mixer. Make sure it has a default scene set.");
                }
            });
    }
}

// Change Default Scene
// This changes the default scene of a group to something else.
function changeScenes(groupID, sceneID) {
    const group = groupID;
    const scene = sceneID;

    if (group !== "None") {
        mixerClient
            .synchronizeGroups()
            .then(() => {
                logger.info('Changing ' + group + ' to ' + scene + '.');
                let groupfinal = mixerClient.state.getGroup(group);
                groupfinal.sceneID = scene;
                mixerClient.updateGroups({groups: [groupfinal]});
            });
    }
}


// Return Control by ID
// This will have the mixer client search all scenes for the id.
function returnButtonById(buttonID) {
    return new Promise(resolve => resolve(mixerClient.state.getControl(buttonID)));
}

// Get connection status
function getInteractiveStatus() {
    return interactiveConnected;
}

// Live Button Updater
// This function will take in a firebot control json object and then push updates to live buttons if we're connected.
function liveButtonUpdater(controlObj) {

    // If we're online...
    if (getInteractiveStatus()) {
        returnButtonById(controlObj.controlId).then((control) => {
            // We just got a button... we just got a button... we just got a button... I wonder what it is?!
            // Send control off to Mixer to update.
            control.update({
                cost: controlObj.cost,
                text: controlObj.text,
                tooltip: controlObj.tooltip,
                // If button is deactivated in firebot, set disabled to true.
                // This also catches controls without an active setting yet.
                disabled: controlObj.active === false ? true : false
            });
        });
    }
}

// Startup modification loop
// This will run upon interactive connection before the board gets put into the "ready" state.
// This goes through all buttons in Firebot and sends over saved values to mixer to update the board.
function startupModificationLoop(interactiveCache) {
    logger.info('Starting Interactive Modification loop to switch out sparks and texts.');
    return new Promise((resolve) => {
        let controls = interactiveCache['firebot'].controls;

        // Loop through controls
        Object.keys(controls).forEach(controlId => {
            if (controls[controlId] != null) {
                let control = controls[controlId];
                liveButtonUpdater({
                    controlId: control.controlId,
                    active: control.active,
                    cost: control.cost,
                    text: control.text,
                    tooltip: control.tooltip
                });
            }
        });

        // Resolve promise.
        resolve(true);
    });
}

// mixer Connect
// This connects to mixer interactive.
function mixerConnect() {
    let dbAuth = dataAccess.getJsonDbInUserData("/user-settings/auth");

    // Get current controls board and set vars.
    try {

        // Get last board name.
        let dbSettings = dataAccess.getJsonDbInUserData("/user-settings/settings");
        let versionId = parseInt(dbSettings.getData('/interactive/lastBoardId'));

        // Get settings for last board.
        let dbControls = dataAccess.getJsonDbInUserData("/user-settings/controls/" + versionId);
        logger.info('Connecting with board version id: ' + versionId);

        // Set interactive cache
        interactiveCache = dbControls.getData('/');

        // Get auth code.
        let authcode = dbAuth.getData('./streamer/accessToken');

        // Connect
        mixerClient.open({
            authToken: authcode,
            versionId: versionId
        }).then(() => {

            mixerClient.on('error', (err) => {
                logger.error("received error from mixer interactive client: " + err.message, err.stack);

                // Try to reconnect.
                //interactiveConnected = false;
                //reconnectService.reconnect('Interactive', false, false);

                return;
            });

            mixerClient.state.on('participantJoin', participant => {
                logger.debug("Interactive participant joined.", participant);
                Grouper.groupQueue(participant);
            });

            // Make game ready
            // Make banned scene
            makeAllScenes()
                .catch((err) => {
                    renderWindow.webContents.send('error', "Error creating scenes on Mixer.");

                    logger.error(err);
                    interactiveConnected = false;
                    reconnectService.reconnect('Interactive', false, false);
                    return {then: function() {} };
                })
                .then(() => makeNewScene('banned'))
                .catch((err) => {
                    renderWindow.webContents.send('error', "Error creating the banned usergroup scene.");

                    logger.error(err);
                    interactiveConnected = false;
                    reconnectService.reconnect('Interactive', false, false);
                    return {then: function() {} };
                })
                .then(() => makeAllGroups())
                .catch((err) => {
                    renderWindow.webContents.send('error', "Error creating groups on Mixer.");

                    logger.error(err);
                    interactiveConnected = false;
                    reconnectService.reconnect('Interactive', false, false);
                    return {then: function() {} };
                })
                .then(() => startupModificationLoop(interactiveCache))
                .catch((err) => {
                    renderWindow.webContents.send('error', "Error with startup modification loop.");

                    logger.error(err);
                    interactiveConnected = false;
                    reconnectService.reconnect('Interactive', false, false);
                    return {then: function() {} };
                })
                .then(() => {
                    // Push everything online.
                    mixerClient.ready(true);

                    // Start auto grouper if both chat and interactive connected.
                    Grouper.startQueue();
                })
                .catch((err) => {
                    renderWindow.webContents.send('error', "Error readying Mixer board.");

                    logger.error(err);
                    interactiveConnected = false;
                    reconnectService.reconnect('Interactive', false, false);
                    return {then: function() {} };
                });

            // Alright, we're all done. Mark everything as online.
            logger.info('Interactive Connected');
            logger.info(`Connected Interactive server: ${mixerClient.socket.socket.url}`);

            renderWindow.webContents.send('connection', "Online");
            interactiveConnected = true;
            let event = new LiveEvent(EventType.INTERACTIVE_CONNECTED, EventSourceType.FIREBOT, {username: "Firebot"});
            eventsRouter.uncachedEvent(event);

        }).catch((err) => {
            renderWindow.webContents.send('error', "Error opening connection to Mixer. The service may be down, or there may be an issue with your auth tokens. Try re-logging into the app.");

            logger.error(err);
            interactiveConnected = false;
            reconnectService.reconnect('Interactive', false, false);
            return {then: function() {} };
        });

    } catch (err) {
        logger.warn(err);
        renderWindow.webContents.send('error', "You need to import an interactive board before trying to connect.");
        renderWindow.webContents.send('connection', "Offline");
        return {then: function() {} };
    }
}

// Returns list of all scene names.
function getScenes() {
    let scenes = interactiveCache['firebot'].scenes;

    let sceneNames = Object.keys(scenes).map(key => scenes[key].sceneName);
    sceneNames.push("default");

    return sceneNames;
}

// Returns list of all group names.
function getGroups() {
    let defaultGroups = ['Pro', 'Subscribers', 'Moderators', 'Channel Editors', 'Staff', 'Streamer', 'default'];

    let customGroups = [];
    let dbGroup = dataAccess.getJsonDbInUserData("/user-settings/groups");
    try {
        let rawGroups = dbGroup.getData('/');
        if (rawGroups != null) {
            customGroups = Object.keys(rawGroups).filter(group => group !== 'sparkExempt' && group !== 'banned');
        }
    } catch (err) {
        logger.error("error getting groups from file: ", err);
    }

    let allGroups = defaultGroups.concat(customGroups);

    return allGroups;
}

// Return Control by Scene
// This finds a button in a scene and returns it.
function returnButton(buttonID, sceneID) {
    return new Promise((resolve) => {
        resolve(mixerClient.state.getScene(sceneID).getControl(buttonID));
    });
}

// Progress Updates
// This will update the progress bar on a button.
function progressUpdate(controlId, progress) {
    // If we're online...
    if (getInteractiveStatus()) {
        returnButtonById(controlId).then((control) => {
            // We just got a button... we just got a button... we just got a button... I wonder what it is?!
            // Send control off to Mixer to update.
            control.update({
                progress: progress
            });
        });
    }
}

async function getEvaluatedPropertyValue(controlModel, propertyName, propertyExpression, trigger) {
    logger.debug(`evaling ${propertyName} str: ${propertyExpression}`);

    propertyExpression = await util.populateStringWithTriggerData(propertyExpression, trigger);

    if (propertyName === "text" || propertyName === "tooltip") {
        return propertyExpression;
    }

    try {
        let evaluation = mathjs.eval(propertyExpression);

        if (isNaN(evaluation)) {
            evaluation = evaluation.entries != null ? evaluation.entries[0] : 0;
        }

        if (propertyName === "progress") {
            evaluation = evaluation / 100;
            if (evaluation > 1) {
                evaluation = 1;
            } else if (evaluation < 0) {
                evaluation = 0;
            }
        } else if (propertyName === "cost" || propertyName === "cooldown") {
            if (evaluation < 0) {
                evaluation = 0;
            }
        }

        return evaluation;
    } catch (err) {
        renderWindow.webContents.send('error', "An error occured when trying to parse a button property: " + err);
        //expression eval failed, return the current value
        return controlModel[propertyName];
    }
}

async function updateControl(control, properties, trigger) {
    // Send control off to Mixer to update.
    let updateObj = {};
    if (properties.cost.shouldUpdate) {
        logger.debug("Updating cost...");
        updateObj.cost = await getEvaluatedPropertyValue(control, 'cost', properties.cost.value, trigger);
    }
    if (properties.text.shouldUpdate) {
        logger.debug("Updating text...");
        updateObj.text = await getEvaluatedPropertyValue(control, 'text', properties.text.value, trigger);
    }
    if (properties.tooltip.shouldUpdate) {
        logger.debug("Updating tooltip...");
        updateObj.tooltip = await getEvaluatedPropertyValue(control, 'tooltip', properties.tooltip.value, trigger);
    }
    if (properties.progress.shouldUpdate) {
        logger.debug("Updating progress...");
        updateObj.progress = await getEvaluatedPropertyValue(control, 'progress', properties.progress.value, trigger);
    }
    if (properties.cooldown != null && properties.cooldown.shouldUpdate) {
        logger.debug("Updating cooldown...");
        let cooldownSecs = await getEvaluatedPropertyValue(control, 'cooldown', properties.cooldown.value, trigger);
        updateObj.cooldown = cooldownSecs * 1000;
        cooldowns.updateCooldownForControlId(control.controlID, updateObj.cooldown / 1000);
    }
    if (properties.disabled.shouldUpdate) {
        logger.debug("Updating active status...");
        updateObj.disabled = properties.disabled.value === 'toggle' ? !control.disabled : properties.disabled.value;
    }
    logger.debug("Sending update.");
    control.update(updateObj);
}

function updateButtonProperties(controlId, properties, trigger) {
    logger.debug(`Updating control id: ${controlId}`);
    if (getInteractiveStatus()) {
        logger.debug(`Getting control object`);
        returnButtonById(controlId).then((control) => {
            updateControl(control, properties, trigger);
        });
    }
}

// Disconnect from mixer
// This disconnects the interactive connections.
function mixerDisconnect() {
    logger.info('Disconnecting interactive.');

    interactiveConnected = false;

    mixerClient.close();
    mixerClient = new interactive.GameClient();

    // Stop and clear auto group queue.
    Grouper.stopQueue();

    //clear Cooldowns
    Cooldowns.reset();

    //clear thresholds
    Threshold.reset();

    // Send connection status to ui.
    renderWindow.webContents.send('connection', "Offline");
}


// Spark Transaction
// This takes in a transaction id and charges the account for sparks.
function sparkTransaction(transactionID) {
    mixerClient.captureTransaction(transactionID);
}

function getParticipantByUserId(userId) {
    return mixerClient.state.getParticipantByUserID(userId);
}

function getParticipantByUsername(username) {
    return mixerClient.state.getParticipantByUsername(username);
}

// Banned User
// This bans a user when they're added to the list in the UI.
function bannedUserAdded(username) {
    // If connected to interactive...
    if (getInteractiveStatus() === true) {
        changeGroups(getParticipantByUsername(username), "banned");
    }
}

// Interactive Toggle
// Controls Turning on and off interactive when connection button is pressed.
ipcMain.on('mixerInteractive', function(event, status) {
    if (!(status === "connect" || status === "connected")) {
        // Kill connection.
        mixerDisconnect(event);
    }
});

// Update Buttons Live
// This gets a message from front end when a button is saved so that we can push changes to mixer.
ipcMain.on('mixerButtonUpdate', function(event, controlObj) {
    liveButtonUpdater(controlObj);
});

// Auth Process
// This kicks off the login process once refresh tokens are recieved.
ipcMain.on('gotRefreshToken', function() {
    mixerConnect();
});

// Refresh Interactive Cache
// This refreshes the interactive cache for the backend with frontend changes are saved.
ipcMain.on('refreshInteractiveCache', function() {
    refreshInteractiveCache();
});

// Ban User Added in UI
// This bans a user when they are added via the ui.
ipcMain.on('bannedUser', function(event, username) {
    bannedUserAdded(username);
});

// Export Functions
exports.sparkTransaction = sparkTransaction;
exports.changeGroups = changeGroups;
exports.changeScenes = changeScenes;
exports.getButtonById = returnButtonById;
exports.returnButton = returnButton;
exports.getParticipantByUserId = getParticipantByUserId;
exports.getGroups = getGroups;
exports.getScenes = getScenes;
exports.getInteractiveStatus = getInteractiveStatus;
exports.getInteractiveCache = getInteractiveCache;
exports.refreshInteractiveCache = refreshInteractiveCache;
exports.progressUpdate = progressUpdate;
exports.updateButtonProperties = updateButtonProperties;
exports.disconnect = mixerDisconnect;
exports.connect = mixerConnect;
