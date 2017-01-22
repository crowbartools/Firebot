// Requirements
const {ipcRenderer, BrowserWindow} = require('electron');


// Error Event from Main Process
// This recieves an event from the the main process and displays a dialog with any errors.
ipcRenderer.on('error', function (event, status){
    // If dialog is not open already...
    if($('#error-log').dialog('isOpen') === false) {
        // Build on error text.
        var statusTemplate = `<img src="./images/error/facepalm.png" class="facepalm">
                              <p>${status}</p>`

        // When text updated, open dialog.
        $('#error-log.ui-dialog-content').html(statusTemplate).promise().done(function(){
            $('#error-log').dialog( "open" );
        });

        // Send disconnect update to main process.
        ipcRenderer.send('beamInteractive', 'disconnect');
    }
})

// Error Process from GUI Events
// This will fire off an error on gui events.
function errorGui(status){
    // If dialog is not open already...
    if($('#error-log').dialog('isOpen') === false) {
        // Build on error text.
        var statusTemplate = `<img src="./images/error/facepalm.png" class="facepalm">
                              <p>${status}</p>`

        // When text updated, open dialog.
        $('#error-log.ui-dialog-content').html(statusTemplate).promise().done(function(){
            $('#error-log').dialog( "open" );
        });

        // Send disconnect update to main process.
        ipcRenderer.send('beamInteractive', 'disconnect');
    }
}


// Initialize Plugin
// On app start initialize the dialog window.
$( document ).ready(function() {
    $( "#error-log" ).dialog({
        closeText: "X",
        autoOpen: false
    });
});


// Export Function
exports.log = errorGui;