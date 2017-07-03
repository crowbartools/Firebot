// Kickstarter
// This function kickstarts the connection process.
function mixerSocketConnect(){
	if ("WebSocket" in window){
		// Let us open a web socket
		var port = 8080;
		if("WEBSOCKET_PORT" in window) {
			if(window.WEBSOCKET_PORT != null && Number.isInteger(window.WEBSOCKET_PORT) && window.WEBSOCKET_PORT > 1024 && window.WEBSOCKET_PORT < 49151) {
				port = window.WEBSOCKET_PORT;
			} else {
				console.warn("Saved websocket port is not valid. Using 8080 instead...")
			}
		} else {
			console.warn("/user-settings/overlay-settings/port.js could not be found. Assuming port is 8080. Resave the port setting in Firebot to generate a new port.js file.")
		}
		
		ws = new ReconnectingWebSocket(`ws://localhost:${port}`);
		ws.onopen = function(){
			notification('close');
			console.log(`Connection is opened on port ${port}...`);
		};

		// When we get a message from the Firebot GUI...
		ws.onmessage = function (evt){
			var data = JSON.parse(evt.data);
			var event = data.event;

			// Pass data on to the correct function.
			switch(event){
				case "image":
					showImage(data);
					break;
				case "video":
					showVideo(data);
					break;
				case "celebration":
					celebrate(data);
					break;
				case "html":
					showHtml(data);
					break;
				default:
					console.log('Unrecognized event type.', data);
			}
		};

		// Connection closed for some reason. Reconnecting Websocket will try to reconnect.
		ws.onclose = function(){
		  console.log(`Connection is closed on port ${port}...`);
		};

		ws.onerror = function(){
			notification('open', `Connecting to Firebot... (${port}).`);
		}

	} else {
		// The browser doesn't support WebSocket
		console.error("Woah, something broke. Abandon ship!");
	}
}
mixerSocketConnect();


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

// Handle notifications
function notification(status, text){
	var divStatus = $('.notification').is(':visible');

	// Check if we need to show notification or not.
	if(divStatus === false && status === "open"){
		// Show the notification
		$('body').prepend('<div class="notification" style="display:none"><p>'+text+'</p></div>');
		$('.notification').fadeIn('fast');
	} else if (status === "close"){
		// Fadeo ut and remove notification
		$(".notification").fadeOut(300, function() { $(this).remove(); });
	}
}

