const {ipcMain} = require('electron');
const JsonDB = require('node-json-db');
const globalInclude = require('../global');

// Setup Beam Interactive and make it a global variable for use throughout the app.
const interactive = require('beam-interactive-node2');
const ws = require('ws');
interactive.setWebSocket(ws);
var beamClient = new interactive.GameClient();
var dbAuth = new JsonDB("./user-settings/auth", true, false);

// Beam Connect
// This connects to beam interactive.
function beamConnect(){
    var dbControls = globalInclude.getBoard;
    var authcode = dbAuth.getData('./streamer/accessToken');
    var versionid = dbControls.getData('./versionid');

    beamClient.open({
        authToken: authcode,
        versionId: versionid
    }).then(() => {
        console.log('Interactive Connected');

        // Loop through scenes and find a default in user settings.
        // TODO: Scenes below always pulls whatever is original set when you go interactive. It never updates after.
        var scenes = dbControls.getData('./firebot/scenes'); 
        for (scene in scenes){
            var sceneID = scenes[scene].sceneName;
            var sceneDefault = scenes[scene].default;
            if(sceneDefault == "Default"){
                var sceneDefault = "default";

                // Create controls for default scene.
                makeScene(sceneID);

                // Make game ready
                beamClient.ready(true);

                // Break loop
                break;
            }
        }

        // We looked in all of the scenes and none are set to be a default.
        if (sceneDefault !== "Default"){
            console.log('Oops! You forgot to set a default scene for this board.');
            beamDisconnect();
        }
    })

    // Log all the things.
    beamClient.on('message', (err) => console.log('<<<', err));
    beamClient.on('send', (err) => console.log('>>>', err));
    beamClient.on('error', (err) => console.log('ERROR:', err));

}

// Make Scene
// This adds buttons onto a scene.
function makeScene(sceneID){
    beamClient.createControls({"sceneID": 'default', "controls": makeControls(sceneID)})
        .then(controls =>{
            controls.forEach((control) => {
                    control.on('mousedown', (inputEvent, participant) => {
                        // Let's tell the user who they are, and what they pushed.
                        console.log(`${participant.username} pushed => ${inputEvent.input.controlID}`);

                        // Did this push involve a spark cost?
                        if (inputEvent.transactionID) {

                            // Unless you capture the transaction the sparks are not deducted.
                            // beamClient.captureTransaction(inputEvent.transactionID)
                            // .then(() => {
                            //     console.log(`Charged ${participant.username} ${control.cost} sparks!`);
                        };
                    });
            });
        });
}

// Make Controls
// Gets the controls for a scene and builds the json for it.
function makeControls(sceneID){
    var controls = [];
    var dbControls = globalInclude.getBoard;
    var scenes = dbControls.getData('/beam');
    // Loop through scenes to find the one that matches given parameter.
    for (item of scenes){
        var itemName = item.sceneID;
        if(scene == itemName){
            for(control of item.controls){
                controls.push(control);
            }
        }
    }
    return controls;
}

// Disconnect from Beam
// This disconnects the interactive connections.
function beamDisconnect(){
    beamClient.close();
    beamClient = new interactive.GameClient();
}

beamClient.state.on('participantJoin', participant => {
    console.log(`${participant.username}(${participant.sessionID}) Joined`);
});
beamClient.state.on('participantLeave', participant => {
    console.log(`${participant} Left`);
});

// Interactive Toggle
// Controls Turning on and off interactive when connection button is pressed.
ipcMain.on('beamInteractive', function(event, status) {
    if(status == "connect" || status == "connected"){
        beamConnect(event);
    } else {
        beamDisconnect(event);
    }
});