const Tessel = require("tessel-io");
const five = require("johnny-five");
WebSocket = require('ws');

// Connects to tessel
firebot = new five.Board({
    io: new Tessel()
});

// Websocket Client Setup 
// This connects to server.
function wsconnect(){
	var ws = new WebSocket('');
	ws.onopen = function(){
		console.log("Connection is opened...");
	};
	ws.on('close', function close(){
		console.log('Socket closed! UH OH.');
	})
	ws.on('error', function error(){
		console.error('Socket encountered error.');
		ws.close()
	})

	ws.on('message', function(response) {
		var response = JSON.parse(response);
		var buttonId = response.key;
		var buttonState = response.event;	
		
		if (buttonId == 0){
			if (buttonState == "off") {
				leds[1].off();
			} else if (buttonState == "pulse") {
				leds[1].pulse(500);
			} else if (buttonState == "blink") {
				leds[1].blink(250);
			} else if (buttonState == "on") {
				leds[1].on();
			}
		} else if (buttonId == 1){
			if (buttonState == "off") {
				leds[2].off();
			} else if (buttonState == "pulse") {
				leds[2].pulse(500);
			} else if (buttonState == "blink") {
				leds[2].blink(250);
			} else if (buttonState == "on") {
				leds[2].on();
			}
		} else if (buttonId == 2){
			if (buttonState == "off") {
				leds[3].off();
			} else if (buttonState == "pulse") {
				leds[3].pulse(500);
			} else if (buttonState == "blink") {
				leds[3].blink(250);
			} else if (buttonState == "on") {
				leds[3].on();
			}
		} else if (buttonId == 3){
			if (buttonState == "off") {
				leds[4].off();
			} else if (buttonState == "pulse") {
				leds[4].pulse(500);
			} else if (buttonState == "blink") {
				leds[4].blink(250);
			} else if (buttonState == "on") {
				leds[4].on();
			}
		} else if (buttonId == 4){
			if (buttonState == "off") {
				leds[5].off();
			} else if (buttonState == "pulse") {
				leds[5].pulse(500);
			} else if (buttonState == "blink") {
				leds[5].blink(250);
			} else if (buttonState == "on") {
				leds[5].on();
			}
		} else if (buttonId == 5){
			if (buttonState == "off") {
				leds[6].off();
			} else if (buttonState == "pulse") {
				leds[6].pulse(500);
			} else if (buttonState == "blink") {
				leds[6].blink(250);
			} else if (buttonState == "on") {
				leds[6].on();
			}
		}
		
		
		
	});
}

////////////////////
// Let's Get Going!
///////////////////

firebot.on("ready", () => {
	leds = new five.Leds(["A2", "A3", "A4", "A5", "A6", "A7"]);
	leds[0].on();
    wsconnect();
});








