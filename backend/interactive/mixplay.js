"use strict";

const {ipcMain} = require('electron');

const EventEmitter = require("events");

const FIREBOT_MIXPLAY_VERSION_ID = 334620;
const FIREBOT_MIXPLAY_SHARECODE = "moo33cku";

const { settings } = require('../common/settings-access');
const accountAccess = require('../common/account-access');
const logger = require("../logwrapper");
const util = require("../utility");
const frontendCommunicator = require("../common/frontend-communicator");
const userDatabase = require("../database/userDatabase");
const activeMixplayUsers = require('../roles/role-managers/active-mixplay-users');

const { buildMixplayModelFromProject, mapMixplayControl } = require("./mixplay-helpers");

const mixplayManager = require('./mixplay-project-manager');

const controlManager = require("./control-manager");

// Setup mixer Interactive and make it a global variable for use throughout the app.
const interactive = require("@mixer/interactive-node");
interactive.setWebSocket(require('ws'));

const mixplayClient = new interactive.GameClient();

/**@type {NodeJS.EventEmitter} */
const events = new EventEmitter();

const SocketState = Object.freeze({
    Idle: 1,
    Connecting: 2,
    Connected: 3,
    Closing: 4,
    Reconnecting: 5,
    Refreshing: 6
});

function mixplayIsConnected() {
    return mixplayClient.socket && mixplayClient.socket.state === SocketState.Connected;
}

let defaultSceneId = "";

let hiddenControls = {};

// Helper function factory to bind events
function addControlHandlers(controls) {
    const addHandler = (control, event) => {

        const controlListener = (inputEvent, participant) => {

            const inputData = inputEvent.input;
            const controlId = inputData.controlID;
            const control = mixplayClient.state.getControl(controlId);
            const sceneId = control.scene.sceneID;

            logger.debug(`Control event "${event}" for control "${inputData.controlID}" in scene "${sceneId}"`);

            controlManager.handleInput(event, sceneId, inputEvent, participant);
        };

        //remove previous listener just in case one exists
        control.off(event, controlListener);

        //register new listener
        control.on(event, controlListener);
    };

    controls.forEach(control => {
        addHandler(control, "mousedown");
        addHandler(control, "mouseup");
        addHandler(control, "keydown");
        addHandler(control, "keyup");
        addHandler(control, "submit");
        addHandler(control, "move");
    });
}

function handleMixplayDisconnect(errorMessage) {
    mixplayManager.setConnectedProjectId(null);
    defaultSceneId = null;
    if (errorMessage) {
        renderWindow.webContents.send("error", errorMessage);
    }
    renderWindow.webContents.send('connection', "Offline");
    events.emit("disconnected");
}

mixplayClient.on('open', () => {
    renderWindow.webContents.send('connection', "Online");
    events.emit("connected");
});

mixplayClient.on('close', () => {
    setTimeout(() => {
        if (mixplayClient.socket.state === SocketState.Closing || mixplayClient.socket.state === SocketState.Idle) {
            handleMixplayDisconnect();
        } else if (mixplayClient.socket.state === SocketState.Connecting) {
            events.emit("connecting");
        } else if (mixplayClient.socket.state === SocketState.Reconnecting) {
            events.emit("reconnecting");
        }
    }, 1);
});

mixplayClient.on('error', err => {
    logger.warn("MixPlay error", err);
    if (mixplayClient.socket.state === SocketState.Closing || mixplayClient.socket.state === SocketState.Idle) {
        handleMixplayDisconnect();
    }
});

async function connectToMixplay() {
    events.emit("connecting");

    let streamer = accountAccess.getAccounts().streamer;
    if (!streamer.loggedIn) {
        handleMixplayDisconnect("You must log into your streamer account before you can connect to MixPlay.");
        return;
    }

    if (!mixplayManager.hasProjects()) {
        // no projects saved yet.
        handleMixplayDisconnect("Unable to connect to MixPlay as there are no MixPlay projects created. If you do not plan to use MixPlay for now, you can disable it from being controlled from the sidebar by openning the Connection Panel (click Connections in bottom left)");
        return;
    }

    let activeProjectId = settings.getActiveMixplayProjectId();

    if (!activeProjectId || activeProjectId.length < 1) {
        handleMixplayDisconnect("You currently have no active project selected. Please select one via the project dropdown in the Controls tab.");
        return;
    }

    let currentProject = mixplayManager.getProjectById(activeProjectId);
    if (currentProject == null) {
        handleMixplayDisconnect("The project set as active doesn't appear to exist anymore. Please set or create a new one in the Controls tab.");
        return;
    }

    // clear our hidden controls cache, this is used in the update control effect
    hiddenControls = {};

    let model = buildMixplayModelFromProject(currentProject);

    mixplayManager.setConnectedProjectId(activeProjectId);

    try {
        //connect to mixplay
        await mixplayClient.open({
            authToken: streamer.auth.access_token,
            versionId: FIREBOT_MIXPLAY_VERSION_ID,
            sharecode: FIREBOT_MIXPLAY_SHARECODE
        });

        await mixplayClient.synchronizeState();

        //clear default scene to ensure we are starting from a clean slate
        const defaultScene = mixplayClient.state.getScene('default');
        await defaultScene.deleteAllControls();

        //create controls for default scene
        await defaultScene.createControls(model.defaultScene.controls);

        //build other scenes
        let scenesArrayData = { scenes: model.otherScenes };
        await mixplayClient.createScenes(scenesArrayData);

        //add control handlers
        let scenes = await mixplayClient.synchronizeScenes();
        scenes.forEach(scene => {
            let controls = scene.getControls();

            addControlHandlers(controls);
        });

        //create groups for each scene
        let groups = [];
        for (let scene of model.otherScenes) {
            groups.push({
                groupID: scene.sceneID,
                sceneID: scene.sceneID
            });
        }
        await mixplayClient.createGroups({ groups: groups });

        //mark as successfully connected
        mixplayClient.ready(true);

        defaultSceneId = currentProject.defaultSceneId;

        const eventManager = require("../events/EventManager");
        eventManager.triggerEvent("firebot", "mixplay-connected", {
            username: "Firebot"
        });

        activeMixplayUsers.cycleActiveMixplayUsers();

    } catch (error) {
        logger.warn("Failed to connect to MixPlay", error);
        handleMixplayDisconnect("Failed to connect to MixPlay.");
    }
}

async function getParticipantsForGroup(groupId) {
    const allParticipants = mixplayClient.state.getParticipants();

    let participants = [];
    allParticipants.forEach(participant => {
        if (participant.groupID === groupId) {
            participants.push(participant);
        }
    });

    return participants;
}

function moveViewerToScene(username, sceneId) {
    let participant = mixplayClient.state.getParticipantByUsername(username);

    let groupID = sceneId;
    if (sceneId === defaultSceneId) {
        groupID = "default";
    }
    participant.groupID = groupID;

    mixplayClient.updateParticipants({
        participants: [participant]
    });
}

async function moveViewersToNewScene(currentSceneId, newSceneId) {

    let currentGroupId = currentSceneId;
    if (currentSceneId === defaultSceneId) {
        currentGroupId = "default";
    }

    let newGroupId = newSceneId;
    if (newSceneId === defaultSceneId) {
        newGroupId = "default";
    }

    let participants = await getParticipantsForGroup(currentGroupId);
    participants.forEach(p => p.groupID = newGroupId);

    mixplayClient.updateParticipants({
        participants: participants
    });
}

function moveAllViewersToScene(newSceneId) {

    let newGroupId = newSceneId;
    if (newSceneId === defaultSceneId) {
        newGroupId = "default";
    }

    let updatedParticipants = [];

    const allParticipants = mixplayClient.state.getParticipants();
    allParticipants.forEach(participant => {
        if (participant.groupID !== newGroupId) {
            participant.groupID = newGroupId;
            updatedParticipants.push(participant);
        }
    });

    if (updatedParticipants.length > 0) {
        mixplayClient.updateParticipants({
            participants: updatedParticipants
        });
    }
}

async function updateCooldownForControls(controlIds, cooldown) {
    let promises = [];

    for (let controlId of controlIds) {
        try {
            let control = mixplayClient.state.getControl(controlId);
            if (control) {
                promises.push(
                    control.update({
                        cooldown: cooldown
                    })
                );
            }
        } catch (err) {
            // something weird happened
            logger.debug("Error when cooling down control", err);
        }
    }

    return Promise.all(promises);
}

async function updateParticipantWithData(userId, data, participant = null) {
    if (!mixplayIsConnected()) return;

    if (participant == null) {
        participant = mixplayClient.state.getParticipantByUserID(userId);
    }

    if (participant == null) return;

    let newParticipant = data;
    newParticipant.sessionID = participant.sessionID;

    await mixplayClient.updateParticipants({
        participants: [newParticipant]
    });
}

async function updateParticipantWithUserData(firebotUser, participant = null) {
    let updateObj = {};

    let hours = firebotUser.minutesInChannel < 60 ? 0 : Math.floor(firebotUser.minutesInChannel / 60);
    updateObj.viewTime = `${util.commafy(hours)} hrs`;

    updateObj.mixplayInteractions = util.commafy(firebotUser.mixplayInteractions);
    updateObj.chatMessages = util.commafy(firebotUser.chatMessages);

    if (firebotUser.currency) {
        let currencyIds = Object.keys(firebotUser.currency);
        for (let currencyId of currencyIds) {
            updateObj[`currency:${currencyId}`] = util.commafy(firebotUser.currency[currencyId]);
        }
    }

    await updateParticipantWithData(firebotUser._id, updateObj, participant);
}

mixplayClient.state.on('participantJoin', async participant => {
    logger.debug(`${participant.username} (${participant.sessionID}) Joined`);

    if (!participant.anonymous) {

        let firebotUser = await userDatabase.getUserById(participant.userID);
        if (firebotUser != null) {
            await updateParticipantWithUserData(firebotUser, participant);
        }

        const eventManager = require("../events/EventManager");
        eventManager.triggerEvent("mixer", "user-joined-mixplay", {
            username: participant.username
        });
    }
});

function getConnectedUsernames() {
    let participants = [...mixplayClient.state.getParticipants().values()];

    return participants
        .filter(p => p != null && !p.anonymous)
        .map(p => p.username);
}

// checks if this sceneId is set as default and returns "default" if so,
// otherwise it returns the original scene id
function translateSceneIdForMixplay(sceneId) {
    let currentProjectId = settings.getActiveMixplayProjectId();
    let currentProject = mixplayManager.getProjectById(currentProjectId);
    if (currentProject) {
        if (sceneId === currentProject.defaultSceneId) {
            return 'default';
        }
    }
    return sceneId;
}

ipcMain.on("controlUpdated", function(_, id) {
    if (!mixplayIsConnected()) return;
    let firebotControl = controlManager.getControlById(id, mixplayManager.getConnectedProjectId());
    if (firebotControl) {
        let mixplayControl = mixplayClient.state.getControl(id);
        if (mixplayControl) {
            mixplayControl.update(mapMixplayControl(firebotControl));
        }
    }
});

ipcMain.on("controlsUpdated", function(_, data) {
    if (!mixplayIsConnected()) return;
    let {sceneId, controls } = data;
    if (!sceneId || !controls) return;
    controls = controls.map(c => mapMixplayControl(c));
    mixplayClient.updateControls({
        sceneID: translateSceneIdForMixplay(sceneId),
        controls: controls
    }).then(() => {
        logger.debug("Successfully updated controls.");
    }, (reason) => {
        logger.warn("Failed to update controls:", reason);
    });
});

ipcMain.on("controlsRemoved", function(_, data) {
    if (!mixplayIsConnected()) return;
    let { sceneId, controlIds } = data;

    let scene = mixplayClient.state.getScene(translateSceneIdForMixplay(sceneId));
    if (scene) {
        scene.deleteControls(controlIds);
    }
});

frontendCommunicator.onAsync("controlAdded", async data => {
    if (!mixplayIsConnected()) return true;

    let { sceneId } = data;
    let firebotControl = data.newControl;

    let mixplayControl = mixplayClient.state.getControl(firebotControl.id);
    if (mixplayControl != null) return true;

    let translatedSceneId = translateSceneIdForMixplay(sceneId);
    let scene = mixplayClient.state.getScene(translatedSceneId);
    if (scene) {
        await scene.createControl(mapMixplayControl(firebotControl));
    }
    return true;
});

// Auth Process
// This kicks off the login process once refresh tokens are recieved.
ipcMain.on("gotRefreshToken", function() {
    connectToMixplay();
});

// Disconnect from mixer
// This disconnects the interactive connections.
function disconnectFromMixplay() {
    logger.info('Disconnecting from MixPlay.');

    mixplayClient.close();
}

// Listen for disconnect toggle
ipcMain.on("mixerInteractive", function(_, status) {
    if (status !== "connect" && status !== "connected") {
        // Kill connection.
        disconnectFromMixplay();
    }
});

exports.mixplayIsConnected = mixplayIsConnected;

exports.getHiddenControls = () => hiddenControls;
exports.markControlAsHidden = (controlId, hidden) => hiddenControls[controlId] = hidden;

exports.events = events;
exports.client = mixplayClient;
exports.connect = connectToMixplay;
exports.disconnect = disconnectFromMixplay;
exports.mapMixplayControl = mapMixplayControl;
exports.moveViewerToScene = moveViewerToScene;
exports.moveViewersToNewScene = moveViewersToNewScene;
exports.moveAllViewersToScene = moveAllViewersToScene;
exports.updateCooldownForControls = updateCooldownForControls;
exports.updateParticipantWithData = updateParticipantWithData;
exports.updateParticipantWithUserData = updateParticipantWithUserData;
exports.getConnectedUsernames = getConnectedUsernames;

