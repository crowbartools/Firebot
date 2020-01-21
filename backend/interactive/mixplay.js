"use strict";

const {ipcMain} = require('electron');

const FIREBOT_MIXPLAY_VERSION_ID = 334620;
const FIREBOT_MIXPLAY_SHARECODE = "moo33cku";

const { settings } = require('../common/settings-access');
const accountAccess = require('../common/account-access');
const logger = require("../logwrapper");

const mixplayManager = require('./mixplay-project-manager');
const eventManager = require("../live-events/EventManager");

const controlManager = require("./control-manager");

// Setup mixer Interactive and make it a global variable for use throughout the app.
const interactive = require("@mixer/interactive-node");
const ws = require('ws');

interactive.setWebSocket(ws);
const mixplayClient = new interactive.GameClient();

let mixplayConnected = false;

let defaultSceneId = "";

let hiddenControls = {};

function mapMixplayControl(firebotControl) {
    let mixplayControl = firebotControl.mixplay;

    mixplayControl.controlID = firebotControl.id;
    mixplayControl.kind = firebotControl.kind;
    if (firebotControl.position != null) {
        mixplayControl.position = firebotControl.position;
    }
    if (firebotControl.active != null) {
        mixplayControl.disabled = !firebotControl.active;
    }


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

            controlManager.handleInput(event, sceneId, inputEvent, participant);
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

function triggerMixplayDisconnect(errorMessage) {
    renderWindow.webContents.send('connection', "Offline");
    mixplayManager.setConnectedProjectId(null);
    mixplayConnected = false;
    defaultSceneId = null;
    if (errorMessage) {
        renderWindow.webContents.send("error", errorMessage);
    }
}

function connectToMixplay() {

    accountAccess.ensureTokenRefreshed("streamer");
    let streamer = accountAccess.getAccounts().streamer;
    if (!streamer.loggedIn) {
        triggerMixplayDisconnect("You must log into your streamer account before you can connect to MixPlay.");
        return;
    }

    if (!mixplayManager.hasProjects()) {
        // no projects saved yet.
        triggerMixplayDisconnect("Unable to connect to MixPlay as there are no MixPlay projects created. If you do not plan to use MixPlay for now, you can disable it from being controlled from the sidebar by openning the Connection Panel (click Connections in bottom left)");
        return;
    }

    let activeProjectId = settings.getActiveMixplayProjectId();

    // clear our hidden controls cache, this is used in the update control effect
    hiddenControls = {};

    if (!activeProjectId || activeProjectId.length < 1) {
        triggerMixplayDisconnect("You currently have no active project selected. Please select one via the project dropdown in the Controls tab.");
        return;
    }

    let currentProject = mixplayManager.getProjectById(activeProjectId);

    if (currentProject == null) {
        triggerMixplayDisconnect("The project set as active doesn't appear to exist anymore. Please set or create a new one in the Controls tab.");
        return;
    }

    let model = buildMixplayModalFromProject(currentProject);

    mixplayManager.setConnectedProjectId(activeProjectId);

    // Connect
    mixplayClient.open({
        authToken: streamer.auth.access_token,
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
        triggerMixplayDisconnect("Failed to connect to MixPlay. Reason: " + reason);
    });
}

mixplayClient.on('error', err => {
    console.log("FAILED TO CONNECT", err);

    triggerMixplayDisconnect();
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

function updateCooldownForControls(controlIds, cooldown) {
    for (let controlId of controlIds) {
        try {
            let control = mixplayClient.state.getControl(controlId);
            if (control) {
                control.update({
                    cooldown: cooldown
                });
            }
        } catch (err) {
            // something weird happened
            logger.debug("Error when cooling down control", err);
        }
    }
}

mixplayClient.state.on('participantJoin', async participant => {
    logger.debug(`${participant.username} (${participant.sessionID}) Joined`);
    eventManager.triggerEvent("mixer", "user-joined-mixplay", {
        username: participant.username
    });
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

ipcMain.on("controlUpdated", function(_, id) {
    if (!mixplayConnected) return;
    let firebotControl = controlManager.getControlById(id, mixplayManager.getConnectedProjectId());
    if (firebotControl) {
        let mixplayControl = mixplayClient.state.getControl(id);
        if (mixplayControl) {
            mixplayControl.update(mapMixplayControl(firebotControl));
        }
    }
});

ipcMain.on("controlsUpdated", function(_, data) {
    if (!mixplayConnected) return;
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
    if (!mixplayConnected) return;
    let { sceneId, controlIds } = data;

    let scene = mixplayClient.state.getScene(translateSceneIdForMixplay(sceneId));
    if (scene) {
        scene.deleteControls(controlIds);
    }
});

ipcMain.on("controlAdded", function(_, data) {
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

exports.getHiddenControls = () => hiddenControls;
exports.markControlAsHidden = (controlId, hidden) => hiddenControls[controlId] = hidden;

exports.client = mixplayClient;
exports.mapMixplayControl = mapMixplayControl;
exports.moveViewerToScene = moveViewerToScene;
exports.moveViewersToNewScene = moveViewersToNewScene;
exports.moveAllViewersToScene = moveAllViewersToScene;
exports.updateCooldownForControls = updateCooldownForControls;

