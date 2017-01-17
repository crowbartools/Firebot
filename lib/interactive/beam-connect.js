const Beam = require('beam-client-node');
const beam = new Beam();
const Interactive = require('beam-interactive-node');
const JsonDB = require('node-json-db');

const dbAuth = new JsonDB("./user-settings/auth", true, false);

// Global Vars
const clientId = "f78304ba46861ddc7a8c1fb3706e997c3945ef275d7618a9";
const channelId = dbAuth.getData('/streamer/channelID');
const authToken = dbAuth.getData('/streamer/token');

// Connects to interactive
function beamConnect() {

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
        .then(robot => setupRobotEvents(robot))
        .catch(err => {
            if (err.res) {
                throw new Error('Error connecting to Interactive:' + err.res.body.message);
            }
            throw err;
        });
};

// Creating Robot
function createRobot(res, channelId) {
    console.log('Creating robot...')
    return new Interactive.Robot({
        remote: res.body.address,
        channel: channelId,
        key: res.body.key,
    });
}

// Robot Handshake
function performRobotHandShake(robot) {
    console.log('Robot Handshaking...');
    return new Promise((resolve, reject) => {
        robot.handshake(err => {
            if (err) {
                reject(err);
            }
            resolve(robot);
        });
    });
}

// Robot Events
function setupRobotEvents(robot) {
    console.log("Good news everyone! Interactive is ready to go!");
    connectFlipper('connected');
    robot.on('report', report => {
        console.log(report);
    });
    robot.on('error', err => {
        console.log('Error setting up robot events.', err);
    });

    robot = robot;
}

// Beam Disconnect
function beamDisconnect(){
    if(robot !== null){
        // Disconnect from interactive
        robot.close();
        connectFlipper('disconnected');
    }
}

// Connect/Disconnect UI Flipper
// Changes UI elements depending on if we're connected or disconnected from beam.
function connectFlipper(status){
    console.log(status);
    if(status == "disconnected"){
        $('.disconnect-interactive').fadeOut('fast', function(){
            $('.launch-interactive').fadeIn('fast');
            $('.interactive-status').removeClass('online').text('Disconnected');
        });
    } else if (status == "connected"){
        $('.launch-interactive').fadeOut('fast', function(){
            $('.disconnect-interactive').fadeIn('fast');
            $('.interactive-status').addClass('online').text('Connected');
        });
    }
};


// Launch Interactive
// Launch interactive when button is clicked.
$( ".launch-interactive" ).click(function() {
    beamConnect();
});

// Disconnect Interactive
// Disconnect interactive when button is clicked.
$( ".disconnect-interactive" ).click(function() {
    beamDisconnect();
});

