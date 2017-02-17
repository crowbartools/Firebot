const {ipcMain, BrowserWindow, globalShortcut} = require('electron');
const Beam = require('beam-client-node');
const beam = new Beam();
const Interactive = require('beam-interactive-node');
const JsonDB = require('node-json-db');

const beamChat = require('./chat-connect.js');
const errorLog = require('../error-logging/error-logging.js');
const reportHandler = require('./controls-router.js');
var dbAuth = new JsonDB("./user-settings/auth", true, false);

// Global Vars
const clientId = "f78304ba46861ddc7a8c1fb3706e997c3945ef275d7618a9";

// Connects to interactive
function beamConnect(event) {

    try{
        var channelId = dbAuth.getData('/streamer/channelID');
        var authToken = dbAuth.getData('/streamer/token');

        beam.use('oauth', {
            clientId: clientId,
            tokens: {
                access: authToken,
                expires: Date.now() + 365 * 24 * 60 * 60 * 1000
            }
        })
        beam.game.join(channelId)
            .then(res => createRobot(res, channelId))
            .then(robot => performRobotHandShake(robot))
            .then(robot => setupRobotEvents(robot,event))
            .catch(err => {
                if (err.res) {
                    errorLog.log('Error connecting to interactive in beamConnect. Try logging in again.')
                    console.log('Error connecting to Interactive:' + err.res.body.message);
                }
                errorLog.log('Error connecting to interactive in beamConnect. Try logging in again.')
                console.log(err);
            });
    } catch (error){
        errorLog.log('You are not signed in or your user settings are missing. Try restarting the app or relogging.');
    }

};

// Creating Robot
function createRobot(res, channelId) {
    console.log('Creating robot...')
    return new Interactive.Robot({
        remote: res.body.address,
        channel: channelId,
        key: res.body.key,
        debug: true
    });
};

// Robot Handshake
function performRobotHandShake(robot) {
    console.log('Robot Handshaking...');
    return new Promise((resolve, reject) => {
        robot.handshake(err => {
            if (err) {
                errorLog.log('Error with robot handshake.')
                reject(err);
            }
            resolve(robot);
        });
    });
};

// Robot Events
function setupRobotEvents(robot,event) {
    console.log("Good news everyone! Interactive is ready to go!");
    
    robot.on('report', report => {
        reportHandler.reportHandler(report);
    });

    robot.on('error', err => {
        errorLog.log('Uh oh! We disconnected. I will try to reconnect in 5 seconds. (This is a general error caused by internet blips or bad button configurations.)')
        console.log('Error setting up robot events.', err);
        beamReconnect();
    });

    robot.on('unexpected-response', res => {
        errorLog.log('Unexpected error with robot.')
        console.log('Unexpected error with robot.', res);
        beamReconnect();
    });

    // Set robot global for render process.
    global.robot = robot;

    // Send to UI
    event.sender.send('beamInteractive', 'connected');

    // Update interactive status in json
    var dbSettings = new JsonDB('./user-settings/settings', true, false);
    dbSettings.push('/interactiveStatus', true);

    // We connected to interactive, so let's connect to chat!
    beamChat.connect();
};

// Beam Reconnect 
function beamReconnect(){
    console.log('Robot dead, looking to see if we should reconnect.');

    // Disconnect if anything is still connected, and flip ui.
    renderWindow.webContents.send('killSwitch', "disconnect");

    // Kick off reconenct
    setTimeout(function(){ 
        renderWindow.webContents.send('killSwitch', "connect");
    }, 5000);
}

// Beam Disconnect
function beamDisconnect(event){
    try{
        // Disconnect from interactive
        global.robot.close();

        // Send to UI
        event.sender.send('beamInteractive', 'disconnected');
        console.log("Interactive is now disconnected!");

        // Update interactive status in json
        var dbSettings = new JsonDB('./user-settings/settings', true, false);
        dbSettings.push('/interactiveStatus', false);

        // Disconnect from chat also.
        beamChat.disconnect();
    } catch(err){
        console.log('Not connected to beam.')
    }
};

// Interactive Toggle
// Controls Turning on and off interactive when connection button is pressed.
ipcMain.on('beamInteractive', function(event, status) {
    if(status == "connect" || status == "connected"){
        beamConnect(event);
    } else {
        beamDisconnect(event);
    }
});


// Global Killswitch
// When Ctrl+ALT+F12 is pressed check interactive status, then send event to render process to flip ui.
function shortcutRegister(){
    globalShortcut.register('CommandOrControl+Alt+F12', () => {
        try{
            var dbSettings = new JsonDB('./user-settings/settings', true, false);
            var status = dbSettings.getData('/interactiveStatus');
        } catch (error){
            var status = false;
        }
        
        // Send event to render process.
        if (status === true){
            renderWindow.webContents.send('killSwitch', "disconnect");
        } else {
            renderWindow.webContents.send('killSwitch', "connect");
        }
    })
}

// Export Functions
exports.shortcut = shortcutRegister;