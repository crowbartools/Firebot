const JsonDB = require('node-json-db');
const Beam = require('beam-client-node');
const beam = new Beam();
const Interactive = require('beam-interactive-node');

// Connects to interactive
function beamConnect() {
    var dbAuth = new JsonDB("./user-settings/auth", true, false);

    // Global Vars
	var clientID = "256e0678a231e8fff721e476d6eb0b43cada80730bd771a4";
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

// Creating Robot
function createRobot(res, channelID) {
    robot = new Interactive.Robot({
        remote: res.body.address,
        channel: channelID,
        key: res.body.key,
    });

    if(res.statusCode === 200){
        // Interactive Connected
        connectFlipper('connected');
    } else {
        // Interactive Problem
        connectFlipper('disconnected');
    }
    
    robot.handshake(err => {
        // Error w handshake
        console.log(err);
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
        }else if(err.code === 'ETIMEDOUT') {
            // Error
        }
    });
}


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

