const {ipcMain, BrowserWindow, globalShortcut} = require('electron');
const JsonDB = require('node-json-db');
const Controls = require('./control-router');
const Chat = require('./mixer-chat');
const Grouper = require('./auto-grouper');

// Setup mixer Interactive and make it a global variable for use throughout the app.
const interactive = require('beam-interactive-node2');
const ws = require('ws');
interactive.setWebSocket(ws);
var mixerClient = new interactive.GameClient();

// Joystick Handler
const joystick = require('./handlers/game-controls/joystick');

// mixer Connect
// This connects to mixer interactive.
function mixerConnect(){

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

        // Connect
        mixerClient.open({
            authToken: authcode,
            versionId: versionid
        }).then(() => {
            // Log all the things.
            /*
            mixerClient.on('message', (err) => console.log('<<<', err));
            mixerClient.on('send', (err) => console.log('>>>', err));
            */
            mixerClient.on('error', (err) => {
                console.log('ERROR:', err);
            });

            mixerClient.state.on('participantJoin', participant => {
                Grouper.groupQueue(participant);
                console.log(`${participant.username}(${participant.sessionID}) Joined`);
            });
            mixerClient.state.on('participantLeave', participant => {
                Grouper.removeUser(participant.username);
                console.log(`${participant.username}(${participant.sessionID}) Left`);
            });

            // Make game ready
            mixerClient.synchronizeScenes()
            .then((res) => { makeAllScenes(); }) // Make all needed scenes.
            .then(() => { makeAllGroups(); }) // Make all needed groups.
            .then(() => { Chat.connect(); }) // Connect to chat.
            .then(() => { Grouper.startQueue(); }) // Start up the queue monitor for auto grouping.
            .then(() => { renderWindow.webContents.send('connection', "Online") }) // Change UI to online.
            .then(() => { return mixerClient.ready(true); }); // Set client to ready.

            console.log('Interactive Connected');

        }, (err) => {
            renderWindow.webContents.send('error', "Error opening connection to Mixer.");
            console.log(err)
        });

    } catch(err){
        console.log(err);
        renderWindow.webContents.send('error', "You need to import an interactive board before trying to connect.");
        return;
    };
}

// Make All Scenes
// This loops through all the scenes and creates them.
function makeAllScenes(){

    // We'll push all scene names here and then at the end we'll check to make sure one of them is "default"..
    var defaultScene = false;

    try{
        // Get last board name.
        var dbSettings = new JsonDB("./user-settings/settings", true, true);
        var gameName = dbSettings.getData('/interactive/lastBoard');

        // Get settings for last board.
        var dbControls = new JsonDB("./user-settings/controls/"+gameName, true, true);

        // Beam Convert. 
        // This is temporarily in place to convert people's json files from Beam to mixer.
        try{
            // Beam info exists, convert it to mixer.
            var gameJson = dbControls.getData('/beam');
            dbControls.push('/mixer', gameJson);
            dbControls.delete('/beam');
        }catch(err){
            // Beam info doesn't exist, grab mixer.
            var gameJson = dbControls.getData('/mixer');
        }

        // Loop through scenes and send them off to be built.
        for (scene of gameJson){
            makeScene(scene.sceneID);
            // If default scene set our pass var to true.
            if(scene.sceneID == "default"){
                var defaultScene = true;
            }
        }

        // Loop through scene names and make sure we have "default".
        if(defaultScene === false){
            renderWindow.webContents.send('error', 'Oops! You dont have a scene named "default". This is the scene non-grouped people will use.');
        }
        
    }catch(err){console.log(err)};
}

// Make Scene
// This adds buttons onto a scene.
function makeScene(sceneName){

    // Delete anything that already exists..
    try{
        var scene = mixerClient.state.getScene(sceneName);
        if(scene !== undefined){
            scene.deleteAllControls();
        }
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

        // Push new controls to mixer. (Scene id default until mixer incorporates groups into node.)
        mixerClient.createControls({"sceneID": sceneName, "controls": makeControls(sceneName)})
            .then(controls =>{
                controls.forEach((control) => {
                    // Bind mousedown event to each control.
                    control.on('mousedown', (inputEvent, participant) => {
                        // Send control on to the control router.
                        var mixerControls = controls;
                        var mixerControl = control;
                        Controls.router('mousedown', mixerControls, mixerControl, gameJson, inputEvent, participant);
                    });
                    // Bind mouseup event to each control.
                    control.on('mouseup', (inputEvent, participant) => {
                        // Send control on to the control router.
                        var mixerControls = controls;
                        var mixerControl = control;
                        Controls.router('mouseup', mixerControls, mixerControl, gameJson, inputEvent, participant);
                    });
                    control.on('move', (inputEvent, participant) => {
                        // Send control on to the control router.
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

        var scenes = dbControls.getData('/mixer');

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

// Make All Groups
// This will build out all of the groups the app needs.
function makeAllGroups(){
    try{
        var groups = [];

        // Get last board name.
        var dbSettings = new JsonDB("./user-settings/settings", true, true);
        var gameName = dbSettings.getData('/interactive/lastBoard');

        // Get settings for last board.
        var dbControls = new JsonDB("./user-settings/controls/"+gameName, true, true);
        var gameScenes = dbControls.getData('./firebot/scenes');

        // Loop through scenes to see which groups are in use.
        for (scene in gameScenes){
            var scene = gameScenes[scene];
            var sceneName = scene.sceneName;
            var groupList = scene.default;

            // Loop through group list and push results to groups..
            for (item of groupList){
                // Don't need to make a default group as that is there anyway.
                if(item !== "Default"){
                    groups.push( {groupID: item, sceneID: sceneName} );
                }
            }
        }

        // Create all groups
        mixerClient.createGroups({
            groups: groups
        })
        
    }catch(err){console.log(err);}
}

// Change Groups
// This changes a user from one group to another.
function changeGroups(participant, groupid){
    participant.groupID = groupid;
    mixerClient.updateParticipants({
        participants: [participant]
    })
}

// Disconnect from mixer
// This disconnects the interactive connections.
function mixerDisconnect(){
    console.log('Disconnecting interactive.');
    mixerClient.close();
    mixerClient = new interactive.GameClient();

    // Stop and clear auto group queue.
    Grouper.stopQueue();

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
    mixerClient.captureTransaction(transactionID);
}

// Interactive Toggle
// Controls Turning on and off interactive when connection button is pressed.
ipcMain.on('mixerInteractive', function(event, status) {
    if(status == "connect" || status == "connected"){
        // Do nothing as this is handled by the "gotRefreshToken" auth process.
    } else {
        // Kill connection.
        mixerDisconnect(event);
    }
});

// Auth Process
// This kicks off the login process once refresh tokens are recieved.
ipcMain.on('gotRefreshToken', function(event, status) {
    mixerConnect();
});

// Export Functions
exports.sparkTransaction = sparkTransaction;
exports.shortcut = shortcutRegister;
exports.changeGroups = changeGroups;