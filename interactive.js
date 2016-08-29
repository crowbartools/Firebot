const JsonDB = require('node-json-db');
const Tessel = require("tessel-io");
const five = require("johnny-five");
const WebSocket = require('ws');
const Beam = require('beam-client-node');
const Interactive = require('beam-interactive-node');
const Packets = require('beam-interactive-node/dist/robot/packets').default;
const beam = new Beam();

// Connects to tessel
firebot = new five.Board({
    io: new Tessel()
});

// Connects to interactive
function beamConnect() {
    var dbAuth = new JsonDB("./settings/auth", true, false);
    var dbControls = new JsonDB('./controls/controls', true, false);

    // Global Vars
    // Use this link to get your oauth token and put it in auth.json.
    // https://beam.pro/oauth/authorize?response_type=token&redirect_uri=http:%2F%2Flocalhost&scope=interactive:robot:self%20interactive:manage:self%20user:details:self&client_id=f78304ba46861ddc7a8c1fb3706e997c3945ef275d7618a9
    app = {
        auth: dbAuth.getData('/'),
        controls: dbControls.getData('/'),
        clientID: "f78304ba46861ddc7a8c1fb3706e997c3945ef275d7618a9"
    }

    const channelId = app.auth['channelID'];
    const authToken = app.auth['token'];

    beam.use('oauth', {
        clientId: app.clientID,
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

    // Connect to scotty.
    wsconnect();
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
    robot.on('report', report => {

        if (report.tactile.length > 0) {
            tactile(report.tactile);
            tactileProgress(report.tactile);
        }
        if (report.joystick.length > 0) {
            joystick(report.joystick[0]);
            joystickProgress(report.joystick[0]);
        }
        if (report.screen.length > 0) {
            screen(report.screen[0]);
            screenProgress(report.screen[0]);
        }

        progressUpdate(robot);
    });
    robot.on('error', err => {
        console.log('Error setting up robot events.', err);
    });

    robot = robot;
}

// Set up WS connection to scottybot.
function wsconnect() {
    ws = new WebSocket('wss://api.scottybot.net/websocket/control');
    ws.on('open', function open() {
        ws.send('{"event":"auth", "msgid": "UUID", "data": "' + app.auth['scottybot'] + '"}');
        ws.send('{"event": "subscribe","msgid": "UUID","data": "commands"}');
        ws.send('{"event": "subscribe","msgid": "UUID","data": "points"}');
        // Heartbeat
        setInterval(function() {
            ws.send('{"heartbeat": "Still alive!"}');

            // Debug, do something every 15 seconds.

        }, 15000);

    });
    ws.on('close', function close() {
        console.log('Socket closed! UH OH.');
    })
    ws.on('error', function error() {
        console.error('Socket encountered error.');
        ws.close()
    })
}

////////////////////
// Handlers
////////////////////

// Tactile Handler
function tactile(tactile) {

    for (i = 0; i < tactile.length; i++) {
        // Get Button Settings for ID
        var rawid = tactile[i].id;
        var holding = tactile[i].holding;
        var press = tactile[i].pressFrequency;
        var button = app.controls[rawid];

        // DO SOME STUFF WITH THE BUTTONS
        if (button !== undefined && button !== null) {
            if (isNaN(press) === false && press > 0) {
                tactilePress(rawid);
            };
        } else {
            console.log("Button " + rawid + " doesn't exist in controls file!");
        }
    }
}

// Joystick Controls
function joystick(report) {
    // DO SOMETHING WITH JOYSTICK REPORT.
}

// Screen Controls
function screen(report) {
    // DO SOMETHING WITH SCREEN REPORT.
}

// Scottybot Handler
// This accepts all scotty responses and determines what to do with them.
ws.on('message', function(response) {
    var data = JSON.parse(response);
    var cmdtype = data.event;

    if (cmdtype == "logon") {
        console.log('Logged in to Scottybot.');
        scottyLightGame();
    }
});

////////////////////
// Progress Updates
////////////////////

// Progress Compile
function progressUpdate(robot) {
    var tactile = app.tactileProgress;
    var screen = app.screenProgress;
    var joystick = app.joystickProgress;

    var progress = {
        "tactile": tactile,
        "screen": screen,
        "joystick": joystick
    }

    //console.log(progress);

    robot.send(new Packets.ProgressUpdate(progress));
    app.tactileProgress = [];
    app.screenProgress = [];
    app.joystickProgress = [];
}

// Tactile
function tactileProgress(tactile) {
    var json = [];
    for (i = 0; i < tactile.length; i++) {
        var rawid = tactile[i].id;
        var holding = tactile[i].holding;
        var press = tactile[i].pressFrequency;

        var controls = app.controls;
        var button = controls.tactile[rawid];
        var cooldown = button['cooldown'];

        // Convert JSON Cooldown Number to Milliseconds
        var cooldown = parseInt(cooldown) * 1000;

        if (isNaN(holding) === false && holding > 0 || isNaN(press) === false && press > 0) {
            json.push({
                "id": rawid,
                "cooldown": cooldown,
                "fired": true,
                "progress": 1
            });
        } else {
            json.push({
                "id": rawid,
                "fired": false,
                "progress": 0
            });
        }
    }
    app.tactileProgress = json;
}

// Screen
function screenProgress(screen) {
    var json = [];
    var rawid = screen.id;
    var mean = screen.coordMean;
    var screenX = mean.x;
    var screenY = mean.y;
    var clicks = screen.clicks;

    if (clicks > 0) {
        json.push({
            "id": rawid,
            "clicks": [{
                "coordinate": mean,
                "intensity": 1
            }]
        });
    }
    app.screenProgress = json;
}

// Joystick
function joystickProgress(joystick) {
    var json = [];
    var rawid = joystick.id;
    var mean = joystick.coordMean;
    var joyX = mean.x;
    var joyY = mean.y;
    if (isNaN(joyX) === true) {
        var joyX = 0;
    }
    if (isNaN(joyY) === true) {
        var joyY = 0;
    }

    var rad = Math.atan2(joyY, joyX);

    json.push({
        "id": rawid,
        "angle": rad,
        "intensity": 1
    });
    app.joystickProgress = json;
}

////////////////////
// Functionality
////////////////////

// Handle Button Taps
function tactilePress(rawid) {
    var controls = app.controls;
    var button = controls.tactile[rawid];
    var buttonState = button['state'];
    var led = new five.Led("a" + rawid);

    if (buttonState == "off") {
        led.off();

        // Prepare for next state.
        dbControls.push('/' + rawid + '/state', "pulse");
    } else if (buttonState == "pulse") {
        led.pulse(500);

        // Prepare for next state.
        dbControls.push('/' + rawid + '/state', "blink");
    } else if (buttonState == "blink") {
        led.blink(250);

        // Prepare for next state.
        dbControls.push('/' + rawid + '/state', "on");
    } else if (buttonState == "on") {
        led.on();

        // Prepare for next state.
        dbControls.push('/' + rawid + '/state', "off");
    }
}

// Scotty Light Game
function scottyLightGame() {
    setInterval(function() {
        // Clear challenge check if it's running.
        if (challengeCheck) {
            clearInterval(challengeCheck);
        }

        // Choose a random challenge and broadcast it.
        var states = ["off", "pulse", "blink", "on"];
        var challenge = states[Math.floor(Math.random() * states.length)];
        sendBroadcast("Firebot Challenge: Change all lights to " + challenge + ". Doing so earns you 1 coin per 5 seconds!");

        // Start checking for win condition.
        var challengeCheck = setInterval(function(states, challenge) {
            var challengeControls = dbControls.getData('/');
            var numberOfLed = Object.keys(challengeControls).length;
            var wins = 0;

            // Loop through JSON and check state of each LED.
            for (var key in challengeControls) {
                if (challengeControls.hasOwnProperty(key)) {
                    var button = app.controls[key];
                    var currentState = button.state;
                    if (currentState == challenge) {
                        var wins = wins + 1;
                    }
                }
            }

            // Awards?
            if (wins === numberOfLed) {
                ws.send('{"event": "giveallpoints","msgid": "UUID","data": 1}');

                var d = new Date();
                var hours = d.getHours();
                var minutes = d.getMinutes();
                console.log('WIN on challenge ' + challenge + '! -> Time:' + hours + ':' + minutes);
            } else {
                console.log('Challenge ' + challenge + ' only had ' + wins + '/6 lights completed.');
            }

        }, 5000);
    }, 300000);
}


////////////////////
// Helpers
///////////////////

// Scotty broadcast.
function sendBroadcast(message) {
    ws.send('{"event": "bethebot", "msgid":"UUID", "data": "' + message + '"}');
}

// Scottbot Giveall Points
function giveallPoints(points) {
    ws.send('{"event": "giveallpoints","msgid": "UUID","data": ' + points + '}');
}


////////////////////
// Let's Get Going!
///////////////////

firebot.on("ready", () => {
    beamConnect();
});
