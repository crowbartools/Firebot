"use strict";

const {ipcMain} = require('electron');

const FIREBOT_MIXPLAY_VERSION_ID = 334620;

const { settings } = require('../common/settings-access');
const accountAccess = require('../common/account-access');
const logger = require("../logwrapper");

const mixplayManager = require('./mixplay-project-manager');

const effectRunner = require("../common/effect-runner");
const { TriggerType } = require("../common/EffectType");

// Setup mixer Interactive and make it a global variable for use throughout the app.
const interactive = require("@mixer/interactive-node");
const ws = require('ws');

interactive.setWebSocket(ws);
const mixplayClient = new interactive.GameClient();


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
            logger.debug("Control event: " + event + " for control: ", inputEvent.input.controlID);
        });
    };

    controls.forEach(control => {
        addHandler(control, "mousedown");
        addHandler(control, "mouseup");
        addHandler(control, "keydown");
        addHandler(control, "keyup");
        addHandler(control, "submit");
        //control.on("move", joystick.go);
    });
}

function connectToMixplay() {
    let currentProjectId = settings.getLastMixplayProjectId();

    let currentProject = mixplayManager.getProjectById(currentProjectId);

    let model = buildMixplayModalFromProject(currentProject);

    accountAccess.updateAccountCache();
    let accessToken = accountAccess.getAccounts().streamer.accessToken;

    console.log('Attempting to connect to interactive...');

    // Connect
    mixplayClient.open({
        authToken: accessToken,
        versionId: 334620,
        sharecode: "moo33cku"
    }).then(() => {
        console.log('Connected to Interactive!');

        mixplayClient.synchronizeState()
            .then(() => {
                const defaultScene = mixplayClient.state.getScene('default');
                defaultScene.deleteAllControls();
                return defaultScene.createControls(model.defaultScene.controls);
            })
            .then(() => mixplayClient.synchronizeScenes())
            .then(scenes => {

                scenes.forEach(scene => {
                    let controls = scene.getControls();
                    addControlHandlers(controls);
                    //console.log(mixplayClient.state.getScene(scene.sceneID).getControls());
                    /*logger.info("Scene Controls: " + scene.);
                    */
                });
            })
            .then(() => {
                mixplayClient.ready(true);
                renderWindow.webContents.send('connection', "Online");
            });
    }, reason => {

    });
}
/*
mixerClient
                .synchronizeScenes()
                .then(() => mixerClient.getScenes())
                .then(res => {
                    res.scenes.forEach(scene => {
                        logger.info("Scene Controls: " + scene.sceneID);
                        addControlHandlers(
                            mixerClient.state.getScene(scene.sceneID).getControls()
                        );
                        resolve(true);
                    });
                })
                .catch(err => {
                    logger.error('Error syncing scenes', err);
                    reject(err);
                });
*/

mixplayClient.on('error', err => {
    console.log("FAILED TO CONNECT", err);

    renderWindow.webContents.send('connection', "Offline");
});

// Auth Process
// This kicks off the login process once refresh tokens are recieved.
ipcMain.on("gotRefreshToken", function() {
    connectToMixplay();
});