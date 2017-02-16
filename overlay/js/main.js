function beamSocketConnect(){
	if ("WebSocket" in window){
		// Let us open a web socket
		ws = new ReconnectingWebSocket("ws://localhost:8080");
		ws.onopen = function(){
			console.log("Connection is opened...");
		};

		// When we get a message from the Firebot GUI...
		ws.onmessage = function (evt){
			var data = JSON.parse(evt.data);
			var event = data.event;

			console.log(data);
			
			if (event == "image"){
				showImage(data);
			}
		};

		// Connection closed for some reason. Reconnecting Websocket will try to reconnect.
		ws.onclose = function(){
		  console.log("Connection is closed...");
		};

	} else {
		// The browser doesn't support WebSocket
		console.error("Woah, something broke. Abandon ship!");
	}
}
beamSocketConnect();

// Image Handling
// This will take the data that is sent to it from the GUI and render an image on the overlay.
function showImage(data){
	// Image Packet...
	// {"event":"image","filepath":filepath, "imageX":imageX, "imageY":imageY, "imageDuration":imageDuration};
	var filepath = data.filepath;
	var imagePosition = data.imagePosition;
	var imageDuration = data.imageDuration;

	// Get time in milliseconds to use as class name.
	var d = new Date();
	var divClass = d.getTime();

	var imageFinal = '<div class="'+divClass+'-image '+imagePosition+'" style="display:none;"><img src="'+filepath+'"></div>';

	$('body').append(imageFinal);
	$('.'+divClass+'-image').fadeIn('fast');

	setTimeout(function(){ 
		$('.'+divClass+'-image').fadeOut('fast');
	}, imageDuration);
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