firebotOverlay = new EventEmitter();

let params = new URL(location).searchParams;

const overlayPort = window.location.port || (window.location.protocol === 'https:' ? 443 : 80);
const baseUrl = window.location.hostname + (overlayPort ? `:${overlayPort}` : '');

startedVidCache = { test: true };

// Kickstarter
// This function kickstarts the connection process.
function overlaySocketConnect(){
	if ("WebSocket" in window){
		// Let us open a web socket
		const websocketProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";

		ws = new ReconnectingWebSocket(`${websocketProtocol}//${baseUrl}`);
		ws.onopen = function(){
			notification('close');
			console.log(`Connection is opened on port ${overlayPort}...`);
		};

		// When we get a message from the Firebot GUI...
		ws.onmessage = function (evt){
			var data = JSON.parse(evt.data);
			var event = data.event;

			var olInstance = params.get("instance");

			console.log(`Received Event: ${event}`);
			console.log(`Overlay Instance: ${olInstance}, Event Instance: ${data.meta.overlayInstance}`)

			if(olInstance != null && olInstance != "") {
				if(data.meta.overlayInstance != olInstance) {
					console.log("Event is for a different instance. Ignoring.")
					return;
				}
			} else {
				if(data.meta.overlayInstance != null && data.meta.overlayInstance != "") {
					console.log("Event is for a specific instance. Ignoring.")
					return;
				}
			}

			if(event == "OVERLAY:REFRESH") {
				console.log(`Refreshing ${data.meta.overlayInstance || ""} overlay...`);
				location.reload();

				return;
			}

            if(event == "getVideoDuration") {
                const token = encodeURIComponent(data.meta.resourceToken);
                const url = `http://${window.location.hostname}:7472/resource/${token}`;
                const videoElement = `
                        <video id="${token}" class="player" style="display:none;">
                            <source src="${url}">
                        </video>
                    `;
                $(".wrapper").append(videoElement);
                const video = document.getElementById(token);
                video.oncanplay = () => {
                    sendWebsocketEvent("video-duration", {resourceToken: token, duration: Math.ceil(video.duration)});
                    video.remove();
                }
            }

			firebotOverlay.emit(event, data.meta);
		};

		// Connection closed for some reason. Reconnecting Websocket will try to reconnect.
		ws.onclose = function(){
		  console.log(`Connection is closed on port ${overlayPort}...`);
		};

		ws.onerror = function(){
			notification('open', `Connecting to Firebot... (${overlayPort}).`);
		}

	} else {
		// The browser doesn't support WebSocket
		console.error("Woah, something broke. Abandon ship!");
	}
}
overlaySocketConnect();

function sendWebsocketEvent(name, data) {
	ws.send(JSON.stringify({
		name,
		data
	}))
}


function loadFonts() {
	$.get(`//${baseUrl}/api/v1/fonts`, (fonts) => {

		let fontStyleBlock = `<style type="text/css">`;

		fonts.forEach(font => {
			let fontPath = `//${baseUrl}/api/v1/fonts/${font.name}`
			fontStyleBlock +=
                `@font-face {
                    font-family: '${font.name}';
                    src: url('${fontPath}') format('${font.format}')
                }
                `;
		});
		fontStyleBlock += "</style>";

		$("head").prepend(fontStyleBlock);
	  });
}

loadFonts();

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