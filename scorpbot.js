const BeamClient = require('beam-client-node');
const BeamSocket = require('beam-client-node/lib/ws');
const beam = new BeamClient();
const Interactive = require('beam-interactive-node');
const Packets = require('beam-interactive-node/dist/robot/packets').default;
const WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({
        port: 8080
    });
const JsonDB = require('node-json-db');
const say = require('say');
const request = require('request');
const parseString = require('xml2js').parseString;
const validator = require('validator');
const randomPuppy = require('random-puppy');

var dbAuth = new JsonDB("./settings/auth", true, false);
var dbControls = new JsonDB('./controls/controls', true, false);
var dbClickerBoss = new JsonDB('./settings/clickerBoss', true, false);


// Global Vars
// Use this link to get your oauth token and put it in auth.json.
// https://beam.pro/oauth/authorize?response_type=token&redirect_uri=http:%2F%2Flocalhost&scope=interactive:robot:self%20interactive:manage:self%20user:details:self%20chat:whisper%20chat:connect%20chat:chat&client_id=f78304ba46861ddc7a8c1fb3706e997c3945ef275d7618a9
app = {
	auth: dbAuth.getData('/'),
	controls: dbControls.getData('/'),
	clickerBoss: dbClickerBoss.getData('/'),
	clientID: "f78304ba46861ddc7a8c1fb3706e997c3945ef275d7618a9",
	progress: ""
}

// Bot Login
beam.use('oauth', {
	clientId: app.clientID,
	tokens: {
		access: app.auth['botToken'],
		expires: Date.now() + 365 * 24 * 60 * 60 * 1000
	}
})

beam.request('GET', `chats/`+app.auth['channelID']).then(response => {
	var body = response.body;
	createBotChatSocket(app.auth['botID'], app.auth['channelID'], body.endpoints, body.authkey);
})
.catch(error => {
	console.log('Something went wrong:', error);
});


// Creates the chat websocket
// This sets up and auths with the chat websocket.
function createBotChatSocket (userId, channelId, endpoints, authkey) {
	
	// Chat connection
	botSocket = new BeamSocket(endpoints).boot();

	// React to chat messages
	botSocket.on('ChatMessage', data => {
		if (data.message.message[0].data.toLowerCase().startsWith('!ping')) {
			
		}
	});

	// Handle errors
	botSocket.on('error', error => {
		console.error('Socket error', error);
	});

	return botSocket.auth(channelId, userId, authkey)
	.then(() => {
		console.log('Bot Login successful');
	});

}

// Streamer Login
beam.use('oauth', {
	clientId: app.clientID,
	tokens: {
		access: app.auth['token'],
		expires: Date.now() + 365 * 24 * 60 * 60 * 1000
	}
})

beam.request('GET', `chats/`+app.auth['channelID']).then(response => {
	var body = response.body;
	createStreamerChatSocket(app.auth['userID'], app.auth['channelID'], body.endpoints, body.authkey);
})
.catch(error => {
	console.log('Something went wrong:', error);
});


// Creates the chat websocket
// This sets up and auths with the chat websocket.
function createStreamerChatSocket (userId, channelId, endpoints, authkey) {
	
	// Chat connection
	streamerSocket = new BeamSocket(endpoints).boot();

	// React to chat messages
	streamerSocket.on('ChatMessage', data => {
		if (data.message.message[0].data.toLowerCase().startsWith('!ping')) {
			streamerWhisper(app.auth['botName'], '!coins add Firebottle 10');
		}
	});

	// Handle errors
	streamerSocket.on('error', error => {
		console.error('Socket error', error);
	});

	return streamerSocket.auth(channelId, userId, authkey)
	.then(() => {
		console.log('Streamer Login successful');
	});

}

//////////////
// Helpers
/////////////

// Send Whisper
function botWhisper(username, message){
	 botSocket.call('whisper', [username, message]);
}

// Send Broadcast
function botBroadcast(message){
	botSocket.call('msg', [message]);
}

// Send Whisper
function streamerWhisper(username, message){
	 streamerSocket.call('whisper', [username, message]);
}

// Send Broadcast
function streamerBroadcast(message){
	streamerSocket.call('msg', [message]);
}

// Give all ponts
function giveallPoints(points){
	setTimeout(function(){ 
			streamerBroadcast('!coins add +viewers('+points+')' );
	}, 1250);
}

// Broadcast to UI
function guiBroadcast(message) {
    guiBroadcast(message);
}

// Capitalize Name
function toTitleCase(str){
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}


// Connects to interactive
function beamConnect() {

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
    var lastProgress = app.lastProgress

    // Compile report.
    var progress = {
        "tactile": tactile,
        "screen": screen,
        "joystick": joystick
    }

    // Send progress update if it has any new info.
	if( isEmpty(tactile) === false || isEmpty(screen) === false || isEmpty(joystick) === false ){
		robot.send(new Packets.ProgressUpdate(progress));
	}

    // Save progress update for comparison next round.
    app.lastProgress = progress;
    
    // Clear temp progress reports.
    app.tactileProgress = [];
    app.screenProgress = [];
    app.joystickProgress = [];
}

// Tactile
function tactileProgress(tactile) {
    var json = [];

    // Events fired this report.
    var soundboardFired = false;
    var coinsFired = false;
    var funFired = false;

    // Loop through report.
    for (i = 0; i < tactile.length; i++) {
        var rawid = tactile[i].id;
        var holding = tactile[i].holding;
        var press = tactile[i].pressFrequency;

        var controls = app.controls;
        var button = controls.tactile[rawid];
        var cooldown = button['cooldown'];
        var event = button['event'];

        // Convert JSON Cooldown Number to Milliseconds
        var cooldown = parseInt(cooldown) * 1000;

        if (isNaN(holding) === false && holding > 0 || isNaN(press) === false && press > 0) {
            if(event == "soundboard" && soundboardFired == false){
                // Soundboard hit! 
                // Cooldown IDs between 2 through 7.
                i = 2;
                while (i < 8) {
                    json.push({
                        "id": i,
                        "cooldown": cooldown,
                        "fired": true,
                        "progress": 1
                    });
                    i++;
                }
                var soundboardFired = true;
            } else if (event == "coins" && coinsFired == false){
                // Coins hit! 
                // Cooldown IDs between 9 through 11.
                i = 9;
                while (i < 12) {
                    json.push({
                        "id": i,
                        "cooldown": cooldown,
                        "fired": true,
                        "progress": 1
                    });
                    i++;
                }
                var coinsFired = true;
            } else if(event == "advice"  && funFired == false || event == "catpic"  && funFired == false || event == "dogpic"  && funFired == false  || event == "aww"  && funFired == false || event == "dogfact"  && funFired == false || event == "catfact"  && funFired == false || event == "numberTrivia"  && funFired == false ) {
                // Fun hit! 
                // Cooldown IDs between 13 through 17.
                i = 14;
                while (i < 19) {
                    json.push({
                        "id": i,
                        "cooldown": cooldown,
                        "fired": true,
                        "progress": 1
                    });
                    i++;
                }
                var funFired = true;
            } else {
				json.push({
					"id": rawid,
					"cooldown": cooldown,
					"fired": true,
					"progress": 1
				});
			}
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
        botBroadcast("Scouts report a monster is approaching the city and will be here in 10 seconds. Prepare to fight!");
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
        botBroadcast('Someone gave everyone ' + coinAmount + ' coins!');
        giveallPoints(coinAmount);
    }

    if (buttonEvent == "quotes") {
        // TTS Quotes
        ttsQuotes();
    }
	
	if ( buttonEvent == "catpic"){
		// Random Cat Pic
		randomCat();
	}
	
	if ( buttonEvent == "dogpic"){
		// Random Dog Pic
		randomDog();
	}
	
	if ( buttonEvent == "aww"){
		// Random Aww pic
		randomAww();
	}
	
	if ( buttonEvent == "pokemon"){
		// Random pokemon
		randomPokemon();
	}
	
	if ( buttonEvent == "catfact"){
		// Random Cat Fact
		randomCatFact();
	}
	
	if ( buttonEvent == "dogfact"){
		// Random Dog Fact
		randomDogFact();
	}

	if ( buttonEvent == "advice"){
		// Random Cat Fact
		randomAdvice();
	}

    if (buttonEvent == "numberTrivia"){
        // Number Trivia
        numberTrivia();
    }
	
    if (buttonEvent == "fireworks"){
        // Fireworks
        fireworks();
    }
	
    if (buttonEvent == "confetti"){
        // Confetti
        confetti();
    }
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

            botBroadcast("A wild " + bossName + " has appeared requiring " + bossClicks + " clicks to kill. Click it to death!");
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
        botBroadcast("The " + bossName + " was defeated (" + timesClicked + "/" + bossClicksNeeded + ")! Everyone gets " + reward + " coins.");
        giveallPoints(reward);
    } else if (timesClicked < bossClicksNeeded && defeated === false) {
        // Fail!
        console.log('Players lost to the ' + bossName + '.');
        botBroadcast("The " + bossName + " has destroyed the party (" + timesClicked + "/" + bossClicksNeeded + "). Everyone meets at the tavern for a sad drink.")
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
            botBroadcast(quoteText);
        } else {
            console.log('Error getting scotty quotes.');
        }
    })
}

function randomAdvice(){
    var url = "http://api.adviceslip.com/advice";
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
		var json = JSON.parse(body);
        var advice = json.slip["advice"];
        try{
            console.log('Advice: '+advice);
            botBroadcast('Advice: '+advice);
        } catch (err){
            randomAdvice();
        }   

	  } else {
		  console.log('Error getting userlist from beam api for joke.');
	  }
	})
}

function randomCat(){
	randomPuppy('catpictures')
		.then(url => {
			try{
				console.log('Random Cat: '+url);
				botBroadcast('Random Cat: '+url);
			} catch (err){
				randomCat();
			}	
	})	
}

function randomDog(){
	randomPuppy('dogpictures')
		.then(url => {
			try{
				console.log('Random Dog: '+url);
				botBroadcast('Random Dog: '+url);
			} catch (err){
				randomDog();
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
			console.log('Cat Fact: '+fact);
			botBroadcast('Cat Fact: '+fact);
		} catch (err){
			randomCatFact();
		}		
	  } else {
		  console.log('Error getting cat fact.');
	  }
	})
}

function randomDogFact(){
	//https://dog-api.kinduff.com/api/facts
	var url = "https://dog-api.kinduff.com/api/facts";
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
		var json = JSON.parse(body);
		var factUnclean = json.facts[0];
		var fact = validator.blacklist( factUnclean, /["']/g);
		try{
			console.log('Dog Fact: '+fact);
			botBroadcast('Dog Fact: '+fact);
		} catch (err){
			randomDogFact();
		}		
	  } else {
		  console.log('Error getting dog fact.');
	  }
	})
}

function randomPokemon(){
	//http://pokeapi.co/api/v2/pokemon/NUMBER (811 max)
	var random = Math.floor(Math.random() * 721) + 1;
	var url = "http://pokeapi.co/api/v2/pokemon/"+random+"/";
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
		var json = JSON.parse(body);
		var name = json.name;
		var nameCap = toTitleCase(name);
		var info = "http://pokemondb.net/pokedex/"+name;
		
		var moveset = json.moves;
		var movedata = moveset[Math.floor(Math.random()*moveset.length)];
		var move = movedata['move'];
		var movename = move.name;
		
		try{
			var text = "I choose you "+nameCap+"! "+nameCap+" used "+movename+"! "+info 
			
			console.log('Pokemon: '+text);
			botBroadcast('Pokemon: '+text);
		} catch (err){
			randomPokemon();
		}		
	  } else {
		  console.log('Error getting pokemon');
	  }
	})
}

function randomAww(){
	randomPuppy('aww')
		.then(url => {
			try{
				console.log('Random Aww: '+url);
				botBroadcast('Random Aww: '+url);
			} catch (err){
				randomAww();
			}	
	})				
}

function numberTrivia(){
	// http://numbersapi.com/random
	var url = "http://numbersapi.com/random";
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
		console.log('Random Number Trivia:'+body);
        botBroadcast('Number Trivia: '+body);
	  } else {
		  console.log('Error getting number trivia.');
	  }
	})
}

function fireworks(){
	guiBroadcast('{ "event": "fireworks"}');
}

function confetti(){
	guiBroadcast('{ "event": "confetti"}');
}

// Check if object empty.
function isEmpty(obj) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }

    return true;
}

beamConnect();