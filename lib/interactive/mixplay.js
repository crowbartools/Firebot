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

    console.log('Attempting to connect to interactive...');

    mixplayManager.setConnectedProjectId(currentProjectId);

    // Connect
    mixplayClient.open({
        authToken: accessToken,
        versionId: FIREBOT_MIXPLAY_VERSION_ID,
        sharecode: FIREBOT_MIXPLAY_SHARECODE
    }).then(() => {
        console.log('Connected to Interactive!');

        mixplayClient.synchronizeState()
            .then(() => {
                console.log('attempting to build default scene...');

                const defaultScene = mixplayClient.state.getScene('default');
                defaultScene.deleteAllControls();

                console.log('Cleared default scene.');

                return defaultScene.createControls(model.defaultScene.controls);
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
                // create groups
            })
            .then(() => {
                mixplayClient.ready(true);
                renderWindow.webContents.send('connection', "Online");
                mixplayConnected = true;
            });
    }, reason => {
        logger.error("Failed to connect to MixPlay.", reason);
        mixplayManager.setConnectedProjectId(null);
    });
}

mixplayClient.on('error', err => {
    console.log("FAILED TO CONNECT", err);

    renderWindow.webContents.send('connection', "Offline");
    mixplayConnected = false;
});

mixplayClient.state.on('participantJoin', participant => {
    console.log(`${participant.username} (${participant.sessionID}) Joined`);
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

