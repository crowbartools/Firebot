"use strict";

const {ipcMain} = require('electron');

const FIREBOT_MIXPLAY_VERSION_ID = 334620;
const FIREBOT_MIXPLAY_SHARECODE = "moo33cku";

const { settings } = require('../common/settings-access');
const accountAccess = require('../common/account-access');
const logger = require("../logwrapper");

const mixplayManager = require('./mixplay-project-manager');

const controlManager = require("./control-manager");

// Setup mixer Interactive and make it a global variable for use throughout the app.
const interactive = require("@mixer/interactive-node");
const ws = require('ws');

interactive.setWebSocket(ws);
const mixplayClient = new interactive.GameClient();

let mixplayConnected = false;

let defaultSceneId = "";

function mapMixplayControl(firebotControl) {
    let mixplayControl = firebotControl.mixplay;

    mixplayControl.controlID = firebotControl.id;
    mixplayControl.kind = firebotControl.kind;
    mixplayControl.position = firebotControl.position;
    mixplayControl.disabled = !firebotControl.active;

    return mixplayControl;
}

function mapMixplayScene(firebotScene, id) {
    let mixplayScene = {
        sceneID: id,
        controls: []
    };

    if (firebotScene.controls) {
        for (let fbControl of firebotScene.controls) {
            let mixplayControl = mapMixplayControl(fbControl);
            mixplayScene.controls.push(mixplayControl);
        }
    }

    return mixplayScene;
}

function buildMixplayModalFromProject(project) {
    //copy the scenes to avoid issues with references
    let firebotScenes = JSON.parse(JSON.stringify(project.scenes));

    let defaultScene;
    let otherScenes = [];
    for (let fbScene of firebotScenes) {
        if (fbScene.id === project.defaultSceneId) {
            defaultScene = mapMixplayScene(fbScene, 'default');
        } else {
            otherScenes.push(mapMixplayScene(fbScene, fbScene.id));
        }
    }

    return {
        id: project.id,
        defaultScene: defaultScene,
        otherScenes: otherScenes,
        groups: []
    };
}

// Helper function factory to bind events
function addControlHandlers(controls) {
    const addHandler = (control, event) => {
        control.on(event, (inputEvent, participant) => {

            const inputData = inputEvent.input;
            const controlId = inputData.controlID;
            const control = mixplayClient.state.getControl(controlId);
            const sceneId = control.scene.sceneID;

            logger.debug(`Control event "${event}" for control "${inputData.controlID}" in scene "${sceneId}"`);

            controlManager.handleInput(event, sceneId, inputData, participant);
        });
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

function connectToMixplay() {
    let currentProjectId = settings.getLastMixplayProjectId();

    let currentProject = mixplayManager.getProjectById(currentProjectId);

    let model = buildMixplayModalFromProject(currentProject);

    accountAccess.updateAccountCache();
    let accessToken = accountAccess.getAccounts().streamer.accessToken;

    mixplayManager.setConnectedProjectId(currentProjectId);

    // Connect
    mixplayClient.open({
        authToken: accessToken,
        versionId: FIREBOT_MIXPLAY_VERSION_ID,
        sharecode: FIREBOT_MIXPLAY_SHARECODE
    }).then(() => {

        mixplayClient.synchronizeState()
            .then(() => {

                const defaultScene = mixplayClient.state.getScene('default');
                defaultScene.deleteAllControls();

                return defaultScene.createControls(model.defaultScene.controls);
            })
            .then(() => {
                let scenesArrayData = { scenes: model.otherScenes };

                return mixplayClient.createScenes(scenesArrayData);
            })
            .then(() => {
                return mixplayClient.synchronizeScenes();
            })
            .then(scenes => {

                scenes.forEach(scene => {
                    let controls = scene.getControls();

                    addControlHandlers(controls);
                });

            })
            .then(() => {
                let groups = [];
                for (let scene of model.otherScenes) {
                    groups.push({
                        groupID: scene.sceneID,
                        sceneID: scene.sceneID
                    });
                }
                return mixplayClient.createGroups({ groups: groups });
            })
            .then(async () => {
                mixplayClient.ready(true);
                renderWindow.webContents.send('connection', "Online");
                mixplayConnected = true;

                defaultSceneId = currentProject.defaultSceneId;
            });
    }, reason => {
        logger.error("Failed to connect to MixPlay.", reason);
        mixplayManager.setConnectedProjectId(null);
        defaultSceneId = null;
    });
}

mixplayClient.on('error', err => {
    console.log("FAILED TO CONNECT", err);

    renderWindow.webContents.send('connection', "Offline");
    mixplayManager.setConnectedProjectId(null);
    mixplayConnected = false;
    defaultSceneId = null;
});

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

function updateCooldownForControls(controlIds, cooldown) {
    for (let controlId of controlIds) {
        let control = mixplayClient.state.getControl(controlId);
        if (control) {
            control.update({
                cooldown: cooldown
            });
        }
    }
}

mixplayClient.state.on('participantJoin', async participant => {
    logger.debug(`${participant.username} (${participant.sessionID}) Joined`);
});

ipcMain.on("controlUpdated", function(_, id) {
    if (!mixplayConnected) return;
    let firebotControl = controlManager.getControlById(id);
    if (firebotControl) {
        let mixplayControl = mixplayClient.state.getControl(id);
        if (mixplayControl) {
            mixplayControl.update(mapMixplayControl(firebotControl));
        }
    }
});

// checks if this sceneId is set as default and returns "default" if so,
// otherwise it returns the original scene id
function translateSceneIdForMixplay(sceneId) {
    let currentProjectId = settings.getLastMixplayProjectId();
    let currentProject = mixplayManager.getProjectById(currentProjectId);
    if (currentProject) {
        if (sceneId === currentProject.defaultSceneId) {
            return 'default';
        }
    }
    return sceneId;
}

ipcMain.on("controlRemovedFromGrid", function(_, data) {
    if (!mixplayConnected) return;
    let { sceneId, controlId } = data;

    let scene = mixplayClient.state.getScene(translateSceneIdForMixplay(sceneId));
    if (scene) {
        scene.deleteControl(controlId);
    }
});

ipcMain.on("controlAddedToGrid", function(_, data) {
    if (!mixplayConnected) return;
    let { sceneId } = data,
        firebotControl = data.control;

    let scene = mixplayClient.state.getScene(translateSceneIdForMixplay(sceneId));
    if (scene) {
        scene.createControl(mapMixplayControl(firebotControl));
    }
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

    //clear Cooldowns
    //clear thresholds
    // Send connection status to ui.
    renderWindow.webContents.send('connection', "Offline");
    mixplayConnected = false;
}
// Listen for disconnect toggle
ipcMain.on("mixerInteractive", function(_, status) {
    if (status !== "connect" && status !== "connected") {
        // Kill connection.
        disconnectFromMixplay();
    }
});

exports.mixplayIsConnected = function() {
    return mixplayConnected;
};

exports.moveViewerToScene = moveViewerToScene;
exports.moveViewersToNewScene = moveViewersToNewScene;
exports.updateCooldownForControls = updateCooldownForControls;

