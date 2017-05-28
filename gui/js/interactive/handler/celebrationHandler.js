// Celebrate Monitor
// Recieves event from main process that a celebration should be shown.
ipcRenderer.on('celebrate', function (event, data){
    broadcast(data);
})