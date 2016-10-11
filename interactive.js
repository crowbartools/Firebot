const Beam = require('beam-client-node');
const Interactive = require('beam-interactive-node');
const Packets = require('beam-interactive-node/dist/robot/packets').default;
const beam = new Beam();
const WebSocket = require('ws');
const WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({
        port: 8080
    });
const JsonDB = require('node-json-db');
const say = require('say');
const request = require('request');
const parseString = require('xml2js').parseString;
const validator = require('validator');

var dbAuth = new JsonDB("./settings/auth", true, false);
var dbControls = new JsonDB('./controls/controls', true, false);
var dbClickerBoss = new JsonDB('./settings/clickerBoss', true, false);

// Connects to interactive
function beamConnect() {

    // Global Vars
    // Use this link to get your oauth token and put it in auth.json.
    // https://beam.pro/oauth/authorize?response_type=token&redirect_uri=http:%2F%2Flocalhost&scope=interactive:robot:self%20interactive:manage:self%20user:details:self&client_id=f78304ba46861ddc7a8c1fb3706e997c3945ef275d7618a9
    app = {
        auth: dbAuth.getData('/'),
        controls: dbControls.getData('/'),
        clickerBoss: dbClickerBoss.getData('/'),
        clientID: "f78304ba46861ddc7a8c1fb3706e997c3945ef275d7618a9",
        progress: ""
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
ws.on('message', function(response) {
    var data = JSON.parse(response);
    var cmdtype = data.event;

    if (cmdtype == "logon") {
        console.log('Logged in to Scottybot.');
    }
    if (cmdtype == "cmdran") {
        var username = data.data["username"];
        var command = data.data["command"];
        var userid = data.data["userid"];
        var rawcommand = data.data["rawcommand"];
        var whisper = data.data["whisper"];
        var isMod = data.data["isMod"];
        var isStreamer = data.data["isStreamer"];

        scottyCommands(username, userid, command, rawcommand, isMod);

    }
});

// Websocket Server
// This allows for the guiBroadcast call to send out data via websocket.
guiBroadcast = function broadcast(data) {
    wss.clients.forEach(function each(client) {
        client.send(data);
    });
};
// This allows the websocket server to accept incoming packets from overlay.
wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        var message = JSON.parse(message);
        var eventType = message.event;
        if (eventType == "bossFightEnd") {
            bossFightEnd(message.data);
        }
    });
});

////////////////////
// Handlers
////////////////////

// Scotty Commands
function scottyCommands(username, userid, command, rawcommand, isMod) {

    if (command == "quote-stop" && isMod === true) {
        say.stop();
        sendBroadcast('Sorry, I could not control my mouth for a second.');
    }

}

// Tactile Handler
function tactile(tactile) {

    for (i = 0; i < tactile.length; i++) {
        // Get Button Settings for ID
        var rawid = tactile[i].id;
        var holding = tactile[i].holding;
        var press = tactile[i].pressFrequency;
        var button = app.controls.tactile[rawid];

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
    var mean = report.coordMean;
    var horizontal = 1920 * mean.x;
    var vertical = 1080 * mean.y;
    var clicks = report.clicks;
    if (isNaN(horizontal) === false && isNaN(vertical) === false) {
        guiBroadcast('{ "event": "mouseclick", "mousex": ' + horizontal + ', "mousey": ' + vertical + ', "clicks": ' + clicks + '}');
    }
}

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

    // Send progress update if it has any new info.
	if(tactile != "" && tactile !== undefined || screen != "" && screen !== undefined || joystick != "" && joystick !== undefined){
		robot.send(new Packets.ProgressUpdate(progress));
	}
    
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
        };
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
    var buttonEvent = button.event;

    if (buttonEvent == "clickerBoss") {
        // Boss Battle
        console.log('Someone pushed the boss battle button.');
        sendBroadcast("Scouts report a monster is approaching the city and will be here in 10 seconds. Prepare to fight!");
        say.speak('There is a boss approaching. Prepare to defend!');
        setTimeout(function() {
            bossFightStart();
        }, 10000);
    }

    if (buttonEvent == "soundboard") {
        // Soundboard
        console.log('Someone pressed soundboard key #' + rawid + '.');
        guiBroadcast('{ "event": "soundboard", "id": "' + rawid + '"}');
    }

    if (buttonEvent == "coins") {
        // Give Coins
        var coinAmount = button.coins;
        console.log('Someone gave everyone ' + coinAmount + ' coins!');
        sendBroadcast('Someone gave everyone ' + coinAmount + ' coins!');
        giveallPoints(coinAmount);
    }

    if (buttonEvent == "quotes") {
        // TTS Quotes
        ttsQuotes();
    }
	
	if ( buttonEvent == "joke"){
		// Random Joke
		randomJoke();
	}
	
	if ( buttonEvent == "catpic"){
		// Random Cat Pic
		randomCat();
	}
	
	if ( buttonEvent == "catfact"){
		// Random Cat Fact
		randomCatFact();
	}

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

// Broadcast to UI
function guiBroadcast(message) {
    guiBroadcast(message);
}

/////////////////////////
// Interactive Games
/////////////////////////
function bossFightStart() {
    // Pick a boss at random from DB.
    var beamUsername = app.auth['username'];
    var bossList = app.clickerBoss['bossFight'];
    var boss = bossList[Math.floor(Math.random() * bossList.length)];
    var bossName = boss.name;
    var bossClicksRaw = boss.clicksPerPerson;
    var reward = boss.reward;
    request('https://beam.pro/api/v1/channels/' + beamUsername + '?fields=viewersCurrent', function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            var viewers = data.viewersCurrent;
            if (viewers === 0) {
                var bossClicks = bossClicksRaw;
            } else {
                var bossClicks = bossClicksRaw * viewers;
            }
            console.log("Boss fight started against a " + bossName + " with " + viewers + " viewers.");
            // Save boss to DB area to compare against after fight. Calculate required clicks based on viewer count.
            dbClickerBoss.push("/bossFightStats/name", bossName);
            dbClickerBoss.push("/bossFightStats/clicksNeeded", bossClicks);
            dbClickerBoss.push("/bossFightStats/reward", reward);
            dbClickerBoss.push("/bossFightStats/defeated", false);

            sendBroadcast("A wild " + bossName + " has appeared requiring " + bossClicks + " clicks to kill. Click it to death!");
            guiBroadcast('{ "event": "bossFight", "name": "' + bossName + '"}');
        } else {
            console.log('Error contacting beam api. Canceling boss fight.');
        }
    });
}

function bossFightEnd(timesClicked) {
    // Check against saved boss to see if number of clicks reached.
    var bossName = dbClickerBoss.getData("/bossFightStats/name");
    var bossClicksNeeded = dbClickerBoss.getData("/bossFightStats/clicksNeeded");
    var reward = dbClickerBoss.getData("/bossFightStats/reward");
    var defeated = dbClickerBoss.getData("/bossFightStats/defeated");

    // Did they get enough clicks?
    if (timesClicked >= bossClicksNeeded && defeated === false) {
        // Win!
        console.log('Players killed the ' + bossName + '.');
        sendBroadcast("The " + bossName + " was defeated (" + timesClicked + "/" + bossClicksNeeded + ")! Everyone gets " + reward + " coins.");
        giveallPoints(reward);
    } else if (timesClicked < bossClicksNeeded && defeated === false) {
        // Fail!
        console.log('Players lost to the ' + bossName + '.');
        sendBroadcast("The " + bossName + " has destroyed the party (" + timesClicked + "/" + bossClicksNeeded + "). Everyone meets at the tavern for a sad drink.")
    }
}

function ttsQuotes() {
    var chanid = app.auth['channelID'];
    var quotePage = "https://api.scottybot.net/showquotes?chanid=" + chanid + "&output=json";
    request(quotePage, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var items = JSON.parse(body);
            var item = items[Math.floor(Math.random() * items.length)];
            var quoteText = item.quote;
            var quoteText = validator.blacklist(quoteText, /["']/g);
            console.log('Quote: ' + quoteText);
			// Commented out TTS for horror month.
		    // say.speak(quoteText);
            sendBroadcast(quoteText);
        } else {
            console.log('Error getting scotty quotes.');
        }
    })
}

function randomJoke(){
	var chanid = app.auth['channelID'];
    var beamapi = "https://beam.pro/api/v1/chats/"+chanid+"/users?limit=100";
	request(beamapi, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
		var json = JSON.parse(body);
		var personObj = json[Math.floor(Math.random()*json.length)];
		var username = personObj["userName"];

		//http://www.icndb.com/api/
		var url = "http://api.icndb.com/jokes/random?escape=javascript&firstName="+username+"&lastName=";
		request(url, function (error, response, body) {
		  if (!error && response.statusCode == 200) {
			var json = JSON.parse(body);
			var content = json.value;
			var joke = validator.blacklist( content.joke , /["']/g);
			try{
				console.log('Joke: '+joke);
				sendBroadcast(joke);
			}catch(err){
				randomJoke();
			}		
		  } else {
			  console.log('Error getting joke.');
		  }
		})

	  } else {
		  console.log('Error getting userlist from beam api for joke.');
	  }
	})
}

function randomCat(){
	//http://thecatapi.com/api/images/get?format=xml&results_per_page=1
	var url = "http://thecatapi.com/api/images/get?format=xml&results_per_page=1";
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
		var xml = body;
		parseString(xml, function (err, result) {
			var catImg = result.response.data[0];
			var catImg2 = catImg.images[0];
			var cat = catImg2.image[0].url;
			console.log('Cat: '+cat);
			sendBroadcast('Random Cat: '+cat);
		});
	  } else {
		  console.log('Error getting cat picture.');
	  }
	})
}

function randomCatFact(){
	//http://catfacts-api.appspot.com/api/facts
	var url = "http://catfacts-api.appspot.com/api/facts";
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
		var json = JSON.parse(body);
		var factUnclean = json.facts[0];
		var fact = validator.blacklist( factUnclean, /["']/g);
		try{
			console.log('Joke: '+fact);
			sendBroadcast('Cat Fact: '+fact);
		} catch (err){
			randomCatFact();
		}		
	  } else {
		  console.log('Error getting cat picture.');
	  }
	})
}

beamConnect();
