// Websocket Server
// This allows for the guiBroadcast call to send out data via websocket.
function broadcast(data) {
    var data = JSON.stringify(data);
    console.log(data);
    wss.clients.forEach(function each(client) {
        client.send(data);
    });
};

// This allows the websocket server to accept incoming packets from overlay.
wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        var message = JSON.parse(message);
        var eventType = message.event;
        // TO DO: This would be where you'd watch for events shown in the GUI to end.
    });
});

// Celebrate Monitor
// Recieves event from main process that a celebration should be shown.
ipcRenderer.on('celebrate', function (event, data){
    broadcast(data);
})