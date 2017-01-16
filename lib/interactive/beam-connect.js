const JsonDB = require('node-json-db');
const Beam = require('beam-client-node');
const beam = new Beam();
const Interactive = require('beam-interactive-node');

// Connects to interactive
function beamConnect() {
    var dbAuth = new JsonDB("./user-settings/auth", true, false);

    // Global Vars
	var clientID = "f78304ba46861ddc7a8c1fb3706e997c3945ef275d7618a9";
    var channelID = dbAuth.getData('/streamer/channelID');
    var authToken = dbAuth.getData('/streamer/token');

    beam.use('oauth', {
        clientId: clientID,
        tokens: {
            access: authToken,
            expires: Date.now() + 365 * 24 * 60 * 60 * 1000
        }
    })
    beam.game.join(channelID)
        .then(res => createRobot(res, channelID))
        .catch(err => {
            if (err.res) {
                // Error
                throw new Error('Error connecting to Interactive:' + err.res.body.message);
            }
            // Error
            throw err;
        });
}

// Creating Robot
function createRobot(res, channelID) {

    robot = new Interactive.Robot({
        remote: res.body.address,
        channel: channelID,
        key: res.body.key
    });
    
    robot.handshake(err => {
        // Error w handshake
        if(err){
            console.log(err);
        }
         resolve(robot);
    });
    
    robot.on('report', report => {
        // Handle the report.
        // Send report on to handlers and progress reporter.
        console.log(report);
    });
    
    robot.on('error', err => {
        // Error
        if(err.code === 'ECONNRESET'){
            // Error
            beamDisconnect()
        }else if(err.code === 'ETIMEDOUT') {
            // Error
            beamDisconnect()
        } else {
            console.error(err);
            beamDisconnect()
        }
    });

    if(res.statusCode === 200){
        // Interactive Connected
        connectFlipper('connected');
        console.log(res);
    } else {
        // Interactive Problem
        connectFlipper('disconnected');
        console.log(res);
    }
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

