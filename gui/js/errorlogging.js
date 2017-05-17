function errorLog(error){
    console.log(error);

    // Kill all connections
    ipcRenderer.send('beamInteractive', 'disconnect');

    // Place text into modal
    $('#error-modal .modal-body p').text(error);

    // Show Modal
    $('#error-modal').modal('toggle')
}

// Watches for an error event from main process
ipcRenderer.on('error', function (event, data){
    errorLog(data);
})