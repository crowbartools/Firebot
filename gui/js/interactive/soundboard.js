const {ipcRenderer} = require('electron');
const howler = require('howler');
const errorLogger = require('../error-logging/error-logging.js');

// Get File Path 
// This opens a file selector dialog, and when a sound is chosen it populates a field with the value.
function setSoundFilePath(filepath){
    $('.sound-file input').val(filepath[0]);
}

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
        // TODO: Make this send button id.
        errorLogger.log('Button #'+buttonID+' does not have a audio file loaded.')
    }

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
ipcRenderer.on('playsound', function (event, filepath){
    playSound(filepath);
})
