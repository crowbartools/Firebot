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

// This holds the connection status of interactive.
var interactiveConnected = false;

// This holds the current interactive board json.
// Refresh immediately for manually testing buttons before connecting.
var interactiveCache = [];
refreshInteractiveCache();

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

        // Set interactive cache
        interactiveCache = dbControls.getData('/');

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
            .then((res) => startupModificationLoop(interactiveCache) )
            .catch(() => {
                renderWindow.webContents.send('error', "Error with startup modification loop.");
                return;
            })
            .then((res) => {
                // Push everything online.
                mixerClient.ready(true)

                // Start auto grouper if both chat and interactive connected.
                Grouper.startQueue();
            })
            .catch(() => {
                renderWindow.webContents.send('error', "Error readying Mixer board.")
                return;
            });
                      
            // Alright, we're all done. Mark everything as online.
            console.log('Interactive Connected');
            renderWindow.webContents.send('connection', "Online") 
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
                            Controls.router('mousedown', controls, control, interactiveCache, inputEvent, participant);
                        });
                        // Bind mouseup event to each control.
                        control.on('mouseup', (inputEvent, participant) => {
                            // Send control on to the control router.
                            Controls.router('mouseup', controls, control, interactiveCache, inputEvent, participant);
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
                console.log('Creating Scene Controls:' +sceneID);
                mixerClient.createScenes({
                    scenes: [{"sceneID": sceneID, "controls": makeControls(sceneID)}]
                })
                .then(controls =>{
                    controls.forEach((control) => {
                        // Bind mousedown event to each control.
                        control.on('mousedown', (inputEvent, participant) => {
                            // Send control on to the control router.
                            Controls.router('mousedown', controls, control, interactiveCache, inputEvent, participant);
                        });
                        // Bind mouseup event to each control.
                        control.on('mouseup', (inputEvent, participant) => {
                            // Send control on to the control router.
                            Controls.router('mouseup', controls, control, interactiveCache, inputEvent, participant);
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
        var scenes = interactiveCache['mixer'];

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

            var gameScenes = interactiveCache['firebot'].scenes;

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

    if(groupid !== "None"){
        mixerClient.synchronizeGroups()
        .then(() => {
            console.log('Changing user to group: '+groupid+'.')
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

// Startup modification loop
// This will run upon interactive connection before the board gets put into the "ready" state.
// This goes through all buttons in Firebot and sends over saved values to mixer to update the board.
function startupModificationLoop(interactiveCache){
    console.log('starting modification loop');
    return new Promise((resolve, reject) => {
        var controls = interactiveCache['firebot'].controls;
        
        // Loop through controls
        for (control in controls){
            var control = controls[control];
    
            // Build Obj to send off.
            var controlObj = {
                controlId: control.controlId,
                active: control.active,
                cost: control.cost,
                text: control.text
            };
    
            // Send update off to mixer.
            // This will update any text, cost, or active status differences.
            liveButtonUpdater(controlObj);
        }

        // Resolve promise.
        resolve(true);
    })
}


// Refresh Controls JSON Cache
function refreshInteractiveCache(retry){

    // FB: I've set a weird retry thing here because I ran into a rare issue where upon saving settings the app tried to
    // save and get the same file at the same time which threw errors and caused the cache to get out
    // of sync.
    if (retry != null){
        var retry = retry;
    } else {
        var retry = 1;
    }

    // Get last board name.
    try{
        var dbSettings = dataAccess.getJsonDbInUserData("/user-settings/settings");
        var gameName = dbSettings.getData('/interactive/lastBoard');
    }catch(err){
        // This could be thrown because we've never launched interactive before and don't have a last used board set yet.
        // Either that, or we're really in trouble because the settings file is completely gone.
        // Either way, we just wan't to skip updating the cache.
        return;
    }

    // We've got the last used board! Let's update the interactive cache.
    if(gameName != null){
        if(retry <= 3){
            try{
                // Get settings for last board.
                var dbControls = dataAccess.getJsonDbInUserData("/user-settings/controls/"+gameName);
                var controlJson = dbControls.getData('/');

                interactiveCache = controlJson;
                console.log('Updated interactive cache.');
            }catch(err){
                console.log('Interactive cache update failed. Retrying. (Try '+retry+'/3)');
                var retry = retry + 1;
                refreshInteractiveCache(retry);
            }
        } else {
            renderWindow.webContents.send('error', "Could not sync up interactive controls cache. Reconnect to try resyncing.");
        }
    }
}

// Gets interactive cache
function getInteractiveCache(){
    return interactiveCache;
}

// Returns list of all scene names.
function getScenes() {
    var scenes = interactiveCache['firebot'].scenes;
    
    var sceneNames = Object.keys(scenes).map((key) => {
       return scenes[key].sceneName;
    });
    
    return sceneNames;
  }
  
// Returns list of all group names.
function getGroups() {
    var defaultGroups = ['Pro', 'Subscribers', 'Moderators', 'Staff'];

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

// Return Control by Scene
// This finds a button in a scene and returns it.
function returnButton(buttonID, sceneID){
    return new Promise((resolve, reject) => {
        var scene = mixerClient.state.getScene(sceneID);
        var control = scene.getControl(buttonID);
        resolve(control);
    })
}

// Return Control by ID 
// This will have the mixer client search all scenes for the id.
function returnButtonById(buttonID){
    return new Promise((resolve, reject) => {
        var control = mixerClient.state.getControl(buttonID);
        resolve(control)
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
    
    //clear cooldowns  
    cooldownSaved = [];

    // Send connection status to ui.
    renderWindow.webContents.send('connection', "Offline");
}

// Live Button Updater
// This function will take in a firebot control json object and then push updates to live buttons if we're connected.
function liveButtonUpdater(controlObj){
    
    // If we're online...
    if( getInteractiveStatus() ){

        returnButtonById(controlObj.controlId)
        .then((control) => {
            // We just got a button... we just got a button... we just got a button... I wonder what it is?!

            // If button is deactivated in firebot, set disabled to true.
            // This also catches controls without an active setting yet.
            if(controlObj.active === false){
                var disabled = true;
            } else {
                var disabled = false;
            }

            // Send control off to Mixer to update.
            control.update({disabled: disabled, cost: controlObj.cost, text: controlObj.text})
        });

    }
}

// Global Killswitch Interactive
// When Ctrl+ALT+F12 is pressed check interactive status, then send event to render process to flip ui.
function shortcutRegister(){
    globalShortcut.register('CommandOrControl+Alt+F12', () => {
        renderWindow.webContents.send('getRefreshToken');
    })
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

// Get connection status
function getInteractiveStatus(){
    return interactiveConnected;
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

// Update Buttons Live
// This gets a message from front end when a button is saved so that we can push changes to mixer.
ipcMain.on('mixerButtonUpdate', function(event, controlObj) {
    liveButtonUpdater(controlObj);
});

// Auth Process
// This kicks off the login process once refresh tokens are recieved.
ipcMain.on('gotRefreshToken', function(event, status) {
    mixerConnect();
});

// Refresh Interactive Cache
// This refreshes the interactive cache for the backend with frontend changes are saved.
ipcMain.on('refreshInteractiveCache', function(event, status) {
    refreshInteractiveCache();
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
exports.getInteractiveStatus = getInteractiveStatus;
exports.getInteractiveCache = getInteractiveCache;
exports.refreshInteractiveCache = refreshInteractiveCache;