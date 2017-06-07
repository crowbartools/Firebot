// Show HTML Monitor
// Recieves event from main process that an image should be shown.
ipcRenderer.on('showhtml', function (event, data){
    showHtml(data);
});


// Shows HTML
// This function takes info given from the main process and then sends a request to the overlay to render it.
function showHtml(data){
    var HTML = data.html;
    var length = data.length;
    var removal = data.removal;

    // Compile data and send to overlay.
    var data = {"event":"html","html": HTML, "length": length, "removal": removal};
    console.log(data);
    broadcast(data);
}