const {ipcMain, BrowserWindow, globalShortcut} = require('electron');
const dataAccess = require('./data-access.js');
const Controls = require('../interactive/control-router');
const Chat = require('./mixer-chat');
const Grouper = require('../interactive/auto-grouper');

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

    var dbAuth = dataAccess.getJsonDbInUserData("/user-settings/auth");

    // Get current controls board and set vars.
    try{
        // Get last board name.
        var dbSettings = dataAccess.getJsonDbInUserData("/user-settings/settings");
        var gameName = dbSettings.getData('/interactive/lastBoard');      
        
        // Get settings for last board.
        var dbControls = dataAccess.getJsonDbInUserData("/user-settings/controls/"+gameName);
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
            mixerClient.on('message', (err) => console.log('>>>', err));
            mixerClient.on('send', (err) => console.log('<<<', err));
            */
           
            
            mixerClient.on('error', (err) => {
                console.log('ERROR:', err);
                if(err.message !== ""){
                    renderWindow.webContents.send('error', err.message);
                }
            });

            mixerClient.state.on('participantJoin', participant => {
                Grouper.groupQueue(participant);
                // console.log(`${participant.username}(${participant.sessionID}) Joined`);
            });
            mixerClient.state.on('participantLeave', participant => {
                // Participant in this case only gives an ID string. 
                // TODO: Figure out how to remove user from grouper queue when they leave.
                // Grouper.removeUser(participant.username);
                // console.log(`${participant} Left`);
            });

            // Make game ready
            // Make banned scene
            makeAllScenes()
            .catch(() => {
                renderWindow.webContents.send('error', "Error creating scenes on Mixer.")
                return;
            })
            .then((res) => makeNewScene('banned') )
            .catch(() => {
                renderWindow.webContents.send('error', "Error creating the banned usergroup scene.")
                return;
            })
            .then((res) => makeAllGroups() )
            .catch(() => {
                renderWindow.webContents.send('error', "Error creating groups on Mixer.")
                return;
            })
            .catch(() => {
                renderWindow.webContents.send('error', "Error connecting to chat and finalizing interactive board.")
                return;
            })
            .then((res) => {
                // Temporary. Wait two seconds to give chat time to connect before giving viewers the board.
                setTimeout(function(){
                    renderWindow.webContents.send('connection', "Online") 
                    mixerClient.ready(true)
                    Grouper.startQueue();
                },2000);
            })
            .catch(() => {
                renderWindow.webContents.send('error', "Error readying Mixer board.")
                return;
            });
                      
            console.log('Interactive Connected');
            
            interactiveConnected = true;

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
// This will put handlers on each control.
function makeAllScenes(){
    return new Promise((resolve, reject) => {
        try{
            // Get last board name.
            var dbSettings = dataAccess.getJsonDbInUserData("/user-settings/settings");
            var gameName = dbSettings.getData('/interactive/lastBoard');

            // Get settings for last board.
            var dbControls = dataAccess.getJsonDbInUserData("/user-settings/controls/"+gameName);
            var controlJson = dbControls.getData('/');

            mixerClient.synchronizeScenes()
            .then((res) => mixerClient.getScenes() )
            .then((res) => {
                var scenes = res.scenes;
                scenes.forEach((scene) =>{
                    console.log('Scene Controls: '+scene.sceneID);
                    var scene = mixerClient.state.getScene(scene.sceneID);
                    var controls = scene.getControls();
                    controls.forEach((control) => {

                        // Bind mousedown event to each control.
                        control.on('mousedown', (inputEvent, participant) => {
                            // Send control on to the control router.
                            Controls.router('mousedown', controls, control, controlJson, inputEvent, participant);
                        });
                        // Bind mouseup event to each control.
                        control.on('mouseup', (inputEvent, participant) => {
                            // Send control on to the control router.
                            Controls.router('mouseup', controls, control, controlJson, inputEvent, participant);
                        });
                        control.on('move', (inputEvent, participant) => {
                            // Send control on to the control router.
                            joystick.go(inputEvent);
                        });
                    });
                    resolve(true);
                })
            })
            .catch((err) => {
                console.log('ERROR:' + err);
                reject(err);
            })
        }catch(err){
            reject(err);
        }
    });
}

// Make New Scene
function makeNewScene(sceneID){
    return new Promise((resolve, reject) => {
        try{
            if(sceneID !== 'banned'){
                // Get last board name.
                var dbSettings = dataAccess.getJsonDbInUserData("/user-settings/settings");
                var gameName = dbSettings.getData('/interactive/lastBoard');

                // Get settings for last board.
                var dbControls = dataAccess.getJsonDbInUserData("/user-settings/controls/"+gameName);
                var controlJson = dbControls.getData('/');

                console.log('Creating Scene Controls:' +sceneID);
                mixerClient.createScenes({
                    scenes: [{"sceneID": sceneID, "controls": makeControls(sceneID)}]
                })
                .then(controls =>{
                    controls.forEach((control) => {
                        // Bind mousedown event to each control.
                        control.on('mousedown', (inputEvent, participant) => {
                            // Send control on to the control router.
                            Controls.router('mousedown', controls, control, controlJson, inputEvent, participant);
                        });
                        // Bind mouseup event to each control.
                        control.on('mouseup', (inputEvent, participant) => {
                            // Send control on to the control router.
                            Controls.router('mouseup', controls, control, controlJson, inputEvent, participant);
                        });
                        control.on('move', (inputEvent, participant) => {
                            // Send control on to the control router.
                            joystick.go(inputEvent);
                        });
                    });
                })
            } else {
                console.log('Creating Scene Controls: '+sceneID);
                mixerClient.createScenes({
                    scenes: [ {"sceneID": sceneID, "controls": []} ]
                })
            }

            resolve(true);
        }catch(err){
            reject(err);
        }
    });
}

// Make Controls
// Gets the controls for a scene and builds the json for it.
function makeControls(sceneID){
    var controls = [];

    // Get current controls board and set vars.
    try{
        // Get last board name.
        var dbSettings = dataAccess.getJsonDbInUserData("/user-settings/settings");
        var gameName = dbSettings.getData('/interactive/lastBoard');

        // Get settings for last board.
        var dbControls = dataAccess.getJsonDbInUserData("/user-settings/controls/"+gameName);

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
    return new Promise((resolve, reject) => {
        try{
            var groups = [];

            // Get last board name.
            var dbSettings = dataAccess.getJsonDbInUserData("/user-settings/settings");
            var gameName = dbSettings.getData('/interactive/lastBoard');

            // Get settings for last board.
            var dbControls = dataAccess.getJsonDbInUserData("/user-settings/controls/"+gameName);
            var gameScenes = dbControls.getData('./firebot/scenes');

            // Loop through scenes to see which groups are in use.
            for (scene in gameScenes){
                var scene = gameScenes[scene];
                var sceneName = scene.sceneName;
                var groupList = scene.default;

                // Loop through group list and push results to groups..
                for (item of groupList){
                    // Don't need to make a default group as that is there anyway.
                    if(item !== "None"){
                        groups.push( {groupID: item, sceneID: sceneName} );
                    }
                }
            }

            // Add in banned user group
            groups.push( {groupID: 'banned', sceneID: 'banned'} );


            // Create all groups
            mixerClient.synchronizeScenes()
            .then((res) => 
                mixerClient.createGroups({
                    groups: groups
                })
            ).then((res) => {
                resolve(true);
            })

        }catch(err){
            console.log(err);
            reject(err);
        }
    });
}

// Change Groups
// This changes a single user from one group to another.
function changeGroups(participantInfo, groupidInfo){
    const participant = participantInfo;
    const groupid = groupidInfo;

    console.log('Changing user to group: '+groupid+'.')
    if(groupid !== "None"){
        mixerClient.synchronizeGroups()
        .then(() => {
            var group = mixerClient.state.getGroup(groupid);
            if(group !== undefined){
                participant.groupID = groupid;
                mixerClient.updateParticipants({
                    participants: [participant]
                })
            } else {
                renderWindow.webContents.send('error', "A button tried to change someone to a group:"+groupid+". But, I couldnt get that group info from Mixer. Make sure it has a default scene set.");
            }
        });
    }
}

// Change Default Scene
// This changes the default scene of a group to something else.
function changeScenes(groupID, sceneID){
    const group = groupID;
    const scene = sceneID;

    if(group !== "None"){
        mixerClient.synchronizeGroups()
        .then(() => {
            console.log('Changing '+group+' to '+scene+'.')
            var groupfinal = mixerClient.state.getGroup(group);
            groupfinal.sceneID = scene;

            mixerClient.updateGroups({
                groups: [groupfinal]
            })
        })
    }
}

// Returns list of all scene names.
function getScenes() {
    // Get last board name.
    var dbSettings = dataAccess.getJsonDbInUserData("/user-settings/settings");
    var gameName = dbSettings.getData('/interactive/lastBoard');      
    
    // Get settings for last board.
    var dbControls = dataAccess.getJsonDbInUserData("/user-settings/controls/"+gameName);
    var scenes = dbControls.getData('./firebot/scenes');
  
    
    var sceneNames = Object.keys(scenes).map((key) => {
       return scenes[key].sceneName;
    });
    
    return sceneNames;
  }
  
  // Returns list of all group names.
  function getGroups() {
    var defaultGroups = ['Pro', 'Subscriber', 'Moderator', 'Staff'];
    
    var customGroups = [];
    var dbGroup = dataAccess.getJsonDbInUserData("/user-settings/groups");      
    try{
        var rawGroups = dbGroup.getData('/');
        if(rawGroups != null) {
          customGroups = Object.keys(rawGroups).filter(group => group != 'sparkExempt' && group != 'banned');
        }         
    }catch(err){console.log(err)};
    
    var allGroups = defaultGroups.concat(customGroups);
    
    return allGroups;
  }

// Return Control
// This finds a button in a scene and returns it.
function returnButton(buttonID, sceneID){
    return new Promise((resolve, reject) => {
        var scene = mixerClient.state.getScene(sceneID);
        var control = scene.getControl(buttonID);
        resolve(control);
    })
}

// Disconnect from mixer
// This disconnects the interactive connections.
function mixerDisconnect(){
    console.log('Disconnecting interactive.');
    
    interactiveConnected = false; 
    
    mixerClient.close();
    mixerClient = new interactive.GameClient();

    // Stop and clear auto group queue.
    Grouper.stopQueue();

    // Disconnect from chat.
    Chat.disconnect();
    
    //clear cooldowns  
    cooldownSaved = [];

    // Send connection status to ui.
    renderWindow.webContents.send('connection', "Offline");
}

// Global Killswitch Interactive
// When Ctrl+ALT+F12 is pressed check interactive status, then send event to render process to flip ui.
function shortcutRegister(){
    globalShortcut.register('CommandOrControl+Alt+F12', () => {
        renderWindow.webContents.send('getRefreshToken');
    })
}

// Global Killswitch Chat
// When Ctrl+ALT+F11 is pressed check interactive status, then send event to render process to flip ui.
function shortcutRegister(){
    globalShortcut.register('CommandOrControl+Alt+F11', () => {
        renderWindow.webContents.send('getChatRefreshToken');
    })
}

// Unregister Shortcuts
// When closing, this is called to unregister the global shortcuts that were created.
function unregisterShortcuts() {
    globalShortcut.unregisterAll();
}

// Spark Transaction
// This takes in a transaction id and charges the account for sparks.
function sparkTransaction(transactionID){
    mixerClient.captureTransaction(transactionID);
}

function getParticipantByUserId(userId) {
  return mixerClient.state.getParticipantByUserID(userId);
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
exports.shortcutUnregister = unregisterShortcuts;
exports.changeGroups = changeGroups;
exports.changeScenes = changeScenes;
exports.returnButton = returnButton;
exports.getParticipantByUserId = getParticipantByUserId;
exports.getGroups = getGroups;
exports.getScenes = getScenes;