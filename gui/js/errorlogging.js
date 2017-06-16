function errorLog(error){

    // Kill all connections
    ipcRenderer.send('mixerInteractive', 'disconnect');

    // Flip UI of connection button to off.
    $('.connection-indicator').removeClass('online');
    $('.connection-text').text('Disconnected - Click to Launch Board');

    // See if we should play a sound or not.
    try{
        var dbSettings = new JsonDB("./user-settings/settings", true, true);
        var soundSetting = dbSettings.getData('./settings/sounds');
        if(soundSetting == "On"){
            connectSound("Offline");
        }
    } catch(err){}

    // If error modal already visible, just keep that one up.
    if($('#error-modal').is(':visible') === false){

        if($('#error-modal .modal-body').text().trim().length === 0){
            // Place text into modal
            $('#error-modal .modal-body p').text(error);
        }

        // Show Modal
        $('#error-modal').modal('show')
    } 
}

// Watches for an error event from main process
ipcRenderer.on('error', function (event, data){
    errorLog(data);
})