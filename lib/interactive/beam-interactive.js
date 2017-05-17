const {ipcMain} = require('electron');
const JsonDB = require('node-json-db');
const Controls = require('./control-router');
const Chat = require('./beam-chat');

// Setup Beam Interactive and make it a global variable for use throughout the app.
const interactive = require('beam-interactive-node2');
const ws = require('ws');
interactive.setWebSocket(ws);
var beamClient = new interactive.GameClient();

// Beam Connect
// This connects to beam interactive.
function beamConnect(){

    var dbAuth = new JsonDB("./user-settings/auth", true, false);

    // Get current controls board and set vars.
    try{
        // Get last board name.
        var dbSettings = new JsonDB("./app-settings/settings", true, true);
        var gameName = dbSettings.getData('/interactive/lastBoard');

        // Get settings for last board.
        var dbControls = new JsonDB("./user-settings/controls/"+gameName, true, true);

        var scenes = dbControls.getData('./firebot/scenes'); 
        var authcode = dbAuth.getData('./streamer/accessToken');
        var versionid = dbControls.getData('./versionid');
    } catch(err){
        console.log(err)
        return;
    };

    beamClient.open({
        authToken: authcode,
        versionId: versionid
    }).then(() => {
        console.log('Interactive Connected');

        // Log all the things.
        //beamClient.on('message', (err) => console.log('<<<', err));
        //beamClient.on('send', (err) => console.log('>>>', err));
        beamClient.on('error', (err) => console.log('ERROR:', err));
        beamClient.state.on('participantJoin', participant => {
            console.log(`${participant.username}(${participant.sessionID}) Joined`);
        });
        beamClient.state.on('participantLeave', participant => {
            console.log(`${participant.username}(${participant.sessionID}) Left`);
        });

        // Loop through scenes and find a default in user settings.
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
        if (sceneDefault !== "default"){
            console.log('Oops! You forgot to set a default scene for this board.');
            beamDisconnect();
        }

        // Then connect to chat as well.
        Chat.connect();

    })
}

// Make Scene
// This adds buttons onto a scene.
function makeScene(sceneID){

    // Get current controls board and set vars.
    try{
        // Get last board name.
        var dbSettings = new JsonDB("./app-settings/settings", true, true);
        var gameName = dbSettings.getData('/interactive/lastBoard');

        // Get settings for last board.
        var dbControls = new JsonDB("./user-settings/controls/"+gameName, true, true);

        var gameJson = dbControls.getData('/');

        // Push new controls to beam. (Scene id default until beam incorporates groups into node.)
        beamClient.createControls({"sceneID": 'default', "controls": makeControls(sceneID)})
            .then(controls =>{
                controls.forEach((control) => {
                    // Bind mousedown event to each control.
                    control.on('mousedown', (inputEvent, participant) => {
                        // Send control on to the control router.
                        var beamControls = controls;
                        var beamControl = control;
                        Controls.router(beamControls, beamControl, gameJson, inputEvent, participant);
                    });
                });
            });
    } catch(err){
        console.log(err)
        return;
    };
}

// Make Controls
// Gets the controls for a scene and builds the json for it.
function makeControls(sceneID){
    var controls = [];

    // Get current controls board and set vars.
    try{
        // Get last board name.
        var dbSettings = new JsonDB("./app-settings/settings", true, true);
        var gameName = dbSettings.getData('/interactive/lastBoard');

        // Get settings for last board.
        var dbControls = new JsonDB("./user-settings/controls/"+gameName, true, true);

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
    } catch(err){
        console.log(err)
        return;
    };
    return controls;
}

// Control Update
// This takes information and updates a button.
function controlUpdate(json){
    beamClient.updateControls(json);
}

// Disconnect from Beam
// This disconnects the interactive connections.
function beamDisconnect(){
    console.log('Disconnecting interactive.');
    beamClient.close();
    beamClient = new interactive.GameClient();

    // Disconnect from chat.
    Chat.disconnect();
}

// Spark Transaction
// This takes in a transaction id and charges the account for sparks.
function sparkTransaction(transactionID){
    beamClient.captureTransaction(transactionID);
}

// Interactive Toggle
// Controls Turning on and off interactive when connection button is pressed.
ipcMain.on('beamInteractive', function(event, status) {
    if(status == "connect" || status == "connected"){
        // Do nothing as this is handled by the "gotRefreshToken" auth process.
    } else {
        // Kill connection.
        beamDisconnect(event);
    }
});

// Auth Process
// This kicks off the login process once refresh tokens are recieved.
ipcMain.on('gotRefreshToken', function(event, status) {
    beamConnect();
});

// Export Functions
exports.sparkTransaction = sparkTransaction;
exports.controlUpdate = controlUpdate;