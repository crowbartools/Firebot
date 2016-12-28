// General Settings
var openTime = 8000;
timesClicked = 0;
paintingStatus = false;

// CHAT
// Connect to Beam Websocket
function beamSocketConnect(){
	if ("WebSocket" in window){
		// Let us open a web socket
		ws = new ReconnectingWebSocket("ws://localhost:8080");
		ws.onopen = function(){
			console.log("Connection is opened...");
		};

		ws.onmessage = function (evt){
			var obj = JSON.parse(evt.data);
			var event = obj.event;
			
			if (event == "mouseclick"){
				mouseclick(obj);
			}
			
			if (event == "bossFight"){
				// Boss fight!
				canvasSetup();
				bossGenerator(obj);
				bossRender();
				bossStart();
			}
			
			if(event == "fireworks"){
				fireworks();
			}
			
			if (event == "confetti"){
				confetti();
			}
			
			if (event == "soundboard"){
				// Play a sound!
				soundboard(obj);
			}
		};

		ws.onclose = function(){
		  // websocket is closed.
		  console.log("Connection is closed...");
		};

	} else {
		// The browser doesn't support WebSocket
		console.error("Woah, something broke. Abandon ship!");
	}
}
beamSocketConnect();

///////////////////////
// Interactive Games
//////////////////////

// Mouse Clicks for Interactive
function mouseclick(obj){

	var mousex = Math.round(obj.mousex);
	var mousey = Math.round(obj.mousey);
	var clicks = obj.clicks;

	gameClicker(mousex, mousey, clicks);
}
// Set up canvas.
function canvasSetup(){
		elem = document.getElementById('game');
		elemLeft = elem.offsetLeft;
		elemTop = elem.offsetTop;
		context = elem.getContext('2d');
}


////////////////////
// BOSS FIGHT
////////////////////

// Collision Checker
function gameClicker(mousex, mousey, clicks){
    var x = mousex,
        y = mousey;
		
		
    elements.forEach(function(element) {
        if (y > element.y - element.height && y < element.y + element.height && x > element.x - element.width && x < element.x + element.width) {
            // Element was clicked!
			
			console.log(mousex, mousey, clicks);
			timesClicked = timesClicked + clicks;
			
        }
    });
}

// Add element.
function bossGenerator(obj){
	var bossName = obj.name;
	console.log(bossName);
	elements = [];
	var screenWidth = 1920;
	var screenHeight = 1080;
	
	elements.push({
		image: './images/monsters/'+bossName+'.png',
		width: 350,
		height: 350,
		y: 500,
		x: 1500,
		isVisible: true
	});
}
function bossRender(){
	// Render elements.
	elements.forEach(function(element) {
		if(element.isVisible === true){
			var imageObj = new Image();
			imageObj.onload = function(){
				context.drawImage(imageObj, element.x, element.y);
			}
			imageObj.src = element.image;
		}
	});
}
function bossStart(){
	$('.horn-sound').trigger('play');
	setTimeout(function(){ 
		ws.send(JSON.stringify({
			"event": "bossFightEnd",
			"data": timesClicked
		}));
		timesClicked = 0;
		context.clearRect(0, 0, 1920, 1080);
	}, 20000);
}

////////////////////////
// Soundboard
///////////////////////
function soundboard(obj){
    var soundId = obj.id;
	$('.soundboard'+soundId).trigger("play");
}

////////////////////////
// Effects
///////////////////////
function fireworks(){
	$('.wrapper').append('<div class="fireworks" style="display:none"><img src="./images/effects/fireworks.gif" width="1920" height="1080"></div>')
	$('.fireworks').fadeIn('fast');
	$('.party-sound').trigger('play');
	setTimeout(function(){ 
		$('.fireworks').fadeOut('fast');
		$('.fireworks').remove();
	}, 6000);
}

function confetti(){
	$('.wrapper').append('<div class="confetti" style="display:none"><img src="./images/effects/confetti.gif" width="1920" height="1080"></div>');
	$('.confetti').fadeIn('fast');
	$('.party-sound').trigger('play');
	setTimeout(function(){ 
		$('.confetti').fadeOut('fast');
		$('.confetti').remove();
	}, 7000);
}


// Error Handling & Keep Alive
function errorHandle(ws){
  var wsState = ws.readyState;
  if (wsState !== 1){
    // Connection not open.
    console.log('Ready State is '+wsState);
  } else {
    // Connection open, send keep alive.
    ws.send(2);
  }
}