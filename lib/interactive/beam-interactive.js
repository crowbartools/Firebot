const {ipcMain, BrowserWindow, globalShortcut} = require('electron');
const JsonDB = require('node-json-db');
const Controls = require('./control-router');
const Chat = require('./beam-chat');

// Setup Beam Interactive and make it a global variable for use throughout the app.
const interactive = require('beam-interactive-node2');
const ws = require('ws');
interactive.setWebSocket(ws);
var beamClient = new interactive.GameClient();

// Joystick Handler
const joystick = require('./handlers/game-controls/joystick');

// Beam Connect
// This connects to beam interactive.
function beamConnect(){

    var dbAuth = new JsonDB("./user-settings/auth", true, false);

    // Get current controls board and set vars.
    try{
        // Get last board name.
        var dbSettings = new JsonDB("./user-settings/settings", true, true);
        var gameName = dbSettings.getData('/interactive/lastBoard');

        // Get settings for last board.
        var dbControls = new JsonDB("./user-settings/controls/"+gameName, true, true);
        var scenes = dbControls.getData('./firebot/scenes');
        var versionid = dbControls.getData('./versionid');

        // Get auth code.
        var authcode = dbAuth.getData('./streamer/accessToken');
    } catch(err){
        console.log(err);
        renderWindow.webContents.send('error', "You need to import an interactive board before trying to connect.");
        return;
    };

    beamClient.open({
        authToken: authcode,
        versionId: versionid
    }).then(() => {
        console.log('Interactive Connected');

        // Log all the things.
        
        beamClient.on('message', (err) => console.log('<<<', err));
        beamClient.on('send', (err) => console.log('>>>', err));
        beamClient.on('error', (err) => {
            console.log('ERROR:', err);
        });
        /** 
        beamClient.state.on('participantJoin', participant => {
            console.log(`${participant.username}(${participant.sessionID}) Joined`);
        });
        beamClient.state.on('participantLeave', participant => {
            console.log(`${participant.username}(${participant.sessionID}) Left`);
        });
        **/

        // Loop through scenes and find a default in user settings.
        for (scene in scenes){
            var sceneID = scenes[scene].sceneName;
            var sceneDefault = scenes[scene].default;
            
            for(setting of sceneDefault){
                if(setting == "Default"){
                    var sceneDefault = "default";
                    
                    // Make game ready
                    beamClient.synchronizeScenes()
                    .then((res) => { makeScene('default', sceneID); })
                    .then(() => { Chat.connect(); })
                    .then(() => { renderWindow.webContents.send('connection', "Online") })
                    .then(() => { return beamClient.ready(true); });
                    
                    // Break loop
                    break;
                }
            }
            break;
        }

        // We looked in all of the scenes and none are set to be a default.
        if (sceneDefault !== "default"){
            renderWindow.webContents.send('error', "Oops! You forgot to set a default scene for this board.");
            return;
        }

    }, (err) => console.log(err) );
}

// Make Scene
// This adds buttons onto a scene.
function makeScene(sceneName, sceneControls){

    // Delete anything that already exists..
    try{
        var scene = beamClient.state.getScene(sceneName);
        scene.deleteAllControls();
    } catch(err){
        console.log(err);
    }

    // Get current controls board and set vars.
    try{
        // Get last board name.
        var dbSettings = new JsonDB("./user-settings/settings", true, true);
        var gameName = dbSettings.getData('/interactive/lastBoard');

        // Get settings for last board.
        var dbControls = new JsonDB("./user-settings/controls/"+gameName, true, true);

        var gameJson = dbControls.getData('/');

        // Push new controls to beam. (Scene id default until beam incorporates groups into node.)
        beamClient.createControls({"sceneID": sceneName, "controls": makeControls(sceneControls)})
            .then(controls =>{
                controls.forEach((control) => {
                    // Bind mousedown event to each control.
                    control.on('mousedown', (inputEvent, participant) => {
                        // Send control on to the control router.
                        var beamControls = controls;
                        var beamControl = control;
                        Controls.router('mousedown', beamControls, beamControl, gameJson, inputEvent, participant);
                    });
                    // Bind mouseup event to each control.
                    control.on('mouseup', (inputEvent, participant) => {
                        // Send control on to the control router.
                        var beamControls = controls;
                        var beamControl = control;
                        Controls.router('mouseup', beamControls, beamControl, gameJson, inputEvent, participant);
                    });
                    control.on('move', (inputEvent, participant) => {
                        // Send control on to the control router.
                        console.log('JOYSTICK MOVING!', inputEvent)
                        joystick.go(inputEvent);
                    });
                });
            });
    } catch(err){
        renderWindow.webContents.send('error', "There was an error creating your scenes.");
        console.log(err);
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
        var dbSettings = new JsonDB("./user-settings/settings", true, true);
        var gameName = dbSettings.getData('/interactive/lastBoard');

        // Get settings for last board.
        var dbControls = new JsonDB("./user-settings/controls/"+gameName, true, true);

        var scenes = dbControls.getData('/beam');

        // Loop through scenes to find the one that matches given parameter.
        for (item of scenes){
            var itemName = item.sceneID;
            if(sceneID == itemName){
                for(control of item.controls){
                    controls.push(control);
                }
            }
        }
    } catch(err){
        renderWindow.webContents.send('error', "There was an error creating your controls.");
        return;
    };
    return controls;
}

// Disconnect from Beam
// This disconnects the interactive connections.
function beamDisconnect(){
    console.log('Disconnecting interactive.');
    beamClient.close();
    beamClient = new interactive.GameClient();

    // Disconnect from chat.
    Chat.disconnect();

    // Send connection status to ui.
    renderWindow.webContents.send('connection', "Offline");
}

// Global Killswitch
// When Ctrl+ALT+F12 is pressed check interactive status, then send event to render process to flip ui.
function shortcutRegister(){
    globalShortcut.register('CommandOrControl+Alt+F12', () => {
        renderWindow.webContents.send('getRefreshToken');
    })
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
exports.shortcut = shortcutRegister;