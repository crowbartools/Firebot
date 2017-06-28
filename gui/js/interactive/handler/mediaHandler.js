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

// Show Image Monitor
// Recieves event from main process that an image should be shown.
ipcRenderer.on('showvideo', function (event, data){
    showVideo(data);
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
    var imageHeight = data.imageHeight;
    var imageWidth = data.imageWidth;
    var imageDuration = parseInt(data.imageDuration);

    var dbSettings = new JsonDB("./user-settings/settings", true, false);

    // Set defaults if they werent filled out.
    if(imagePosition == "" || imagePosition === null){
        var imageX = "Top Middle";
    }
    if(imageHeight == "" || imageHeight === null){
        var imageHeight = false;
    }
    if(imageWidth == "" || imageWidth === null){
        var imageWidth = false;
    }
    if(imageDuration == "" || imageDuration === null){
        var imageDuration = 5;
    }        

    // Setup filepath based on compatibility settings.
    try{
        var compatibility = dbSettings.getData('./settings/overlayImages');
    } catch (err){
        var compatibility = "OBS";
    }
    
    if(compatibility == "Other"){
        var filepath = "file:///"+filepath;
    }else{
        var filepath = "http://absolute/"+filepath;
    }

    // Compile data and send to overlay.
    var data = {"event":"image","filepath":filepath, "imagePosition":imagePosition, "imageHeight":imageHeight, "imageWidth": imageWidth, "imageDuration":imageDuration};
    broadcast(data);
}

// Show a video
// This function takes info given from the main process and then sends a request to the overlay to render it.
function showVideo(data){
    var filepath = data.filepath;
    var videoPosition = data.videoPosition;
    var videoHeight = data.videoHeight;
    var videoWidth = data.videoWidth;
    var videoDuration = parseInt(data.videoDuration);

    var dbSettings = new JsonDB("./user-settings/settings", true, false);

    // Set defaults if they werent filled out.
    if(videoPosition == "" || videoPosition === null){
        var videoX = "Top Middle";
    }
    if(videoHeight == "" || videoHeight === null){
        var imageHeight = false;
    }
    if(videoWidth == "" || videoWidth === null){
        varvideoWidth = false;
    }
    if(videoDuration == "" || videoDuration === null){
        var videoDuration = 5;
    }        

    // Setup filepath based on compatibility settings.
    try{
        var compatibility = dbSettings.getData('./settings/overlayImages');
    } catch (err){
        var compatibility = "OBS";
    }
    
    if(compatibility == "Other"){
        var filepath = "file:///"+filepath;
    }else{
        var filepath = "http://absolute/"+filepath;
    }

    // Compile data and send to overlay.
    var data = {"event":"video","filepath":filepath, "videoPosition":videoPosition, "videoHeight":videoHeight, "videoWidth": videoWidth, "videoDuration":videoDuration};
    broadcast(data);
}