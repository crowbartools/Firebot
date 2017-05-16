// Play Sound
// Recieves event from main process that a sound has been pressed.
ipcRenderer.on('playsound', function (event, data){
    playSound(data);
});

// Show Image Monitor
// Recieves event from main process that an image should be shown.
ipcRenderer.on('showimage', function (event, data){
    showImage(data);
});

// Play Sound
// This function takes info given from the main process and then plays a sound.
function playSound(data){
    var filepath = data.filepath;
    var volume = (data.volume / 100) * 10;

    var sound = new Howl({
        src: [filepath],
        volume: volume
    });

    sound.play();
}

// Show an image
// This function takes info given from the main process and then sends a request to the overlay to render it.
function showImage(data){
    var filepath = data.filepath;
    var imagePosition = data.imagePosition;
    var imageDuration = parseInt(data.imageDuration);

    var dbSettings = new JsonDB("./user-settings/settings", true, false);

    // Set defaults if they werent filled out.
    if(imagePosition == "" || imagePosition === null){
        var imageX = "Top Middle";
    }
    if(imageDuration == "" || imageDuration === null){
        var imageDuration = 5;
    }        

    // Setup filepath based on compatibility settings.
    try{
        var compatibility = dbSettings.getData('/interactive/mediaCompatibility');
    } catch (err){
        var compatibility = "default";
    }
    
    if(compatibility == "obs"){
        var filepath = "http://absolute/"+filepath;
    }else{
        var filepath = "file:///"+filepath;
    }
    console.log(filepath);

    // Compile data and send to overlay.
    var data = {"event":"image","filepath":filepath, "imagePosition":imagePosition, "imageDuration":imageDuration};
    broadcast(data);
}