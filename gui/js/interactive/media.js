const {ipcRenderer} = require('electron');
const howler = require('howler');
const errorLogger = require('../error-logging/error-logging.js');
const webSocket = require('../websocket.js');

// Play Sound
// This function takes info given from the main process and then plays a sound.
function playSound(data){
    var filepath = data.filepath;
    var volume = data.volume;
    var buttonID = data.buttonID;

    // Check if volume was entered.
    console.log(volume);
    if (volume === null || volume == ""){
        var volume = 1;
    }
    
    if (filepath !== null){
        var sound = new Howl({
            src: [filepath],
            volume: volume
        });

        sound.play();
    } else {
        errorLogger.log('Button #'+buttonID+' does not have a audio file loaded.')
    }
}

// Show an image
// This function takes info given from the main process and then sends a request to the overlay to render it.
function showImage(data){
    var buttonID = data.buttonID;
    var filepath = data.filepath;
    var imageX = data.imageX;
    var imageY = data.imageY;
    var imageDuration = data.imageDuration;

    if (filepath !== null){
        // Set defaults if they werent filled out.
        if(imageX == "" || imageX === null){
            var imageX = 0;
        }
        if(imageY == "" || imageY === null){
            var imageY = 0;
        }
        if(imageDuration == "" || imageDuration === null){
            var imageDuration = 5;
        }

        // Compile data and send to overlay.
        var data = {"event":"image","filepath":filepath, "imageX":imageX, "imageY":imageY, "imageDuration":imageDuration};
        webSocket.broadcast(data);
    } else {
        errorLogger.log('Button #'+buttonID+' does not have an image file loaded.')
    }
}

// Get Sound File Path 
// This opens a file selector dialog, and when a sound is chosen it populates a field with the value.
function setSoundFilePath(filepath){
    $('.sound-file input').val(filepath[0]);
}

// Audio File Selector
// This monitors the audio file select box and when it is clicked sends request to main process to open dialog.
$( ".sound-selector" ).click(function() {
    ipcRenderer.send('getSoundPath');
});

// Got Sound File Path
// Recieves event from main process that a sound file path has been recieved.
ipcRenderer.on('gotSoundFilePath', function (event, filepath){
    setSoundFilePath(filepath);
})

// Play Sound
// Recieves event from main process that a sound has been pressed.
ipcRenderer.on('playsound', function (event, data){
    playSound(data);
})

// Get Image File Path 
// This opens a file selector dialog, and when an image is chosen it populates a field with the value.
function setImageFilePath(filepath){
    $('.image-popup input').val(filepath[0]);
}

// Image File Selector
// This monitors the audio file select box and when it is clicked sends request to main process to open dialog.
$( ".image-selector" ).click(function() {
    ipcRenderer.send('getImagePath');
});

// Got Image File Path
// Recieves event from main process that an image file path has been recieved.
ipcRenderer.on('gotImageFilePath', function (event, filepath){
    setImageFilePath(filepath);
})

// Show Image Monitor
// Recieves event from main process that an image should be shown.
ipcRenderer.on('showimage', function (event, data){
    showImage(data);
})
