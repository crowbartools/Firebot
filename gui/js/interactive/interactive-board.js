// Requirements
const fs = require('fs');
const JsonDB = require('node-json-db');
const jqValidate = require('../form-validation.js');
const {ipcRenderer} = require('electron');
const errorLogger = require('../error-logging/error-logging.js');
const jsonImporter = require('./json-importer');

// Initialize the Button Menu
// This starts up sidr to create the side button menu.
$('.hidden').sidr({
    name: 'button-menu',
    source: '#button-menu',
    side: 'right',
    renaming: false,
    onOpen: function(){
        // Stuff happens here when menu opens.
    }
});

// Initialize the Board Menu
// This starts up sidr to create the side board menu.
$('.hidden').sidr({
    name: 'board-menu',
    source: '#board-menu',
    side: 'right',
    renaming: false,
    onOpen: function(){
        // Stuff happens here when menu opens.
    }
});

// Initialize the Board Menu
// This starts up sidr to create the side board menu.
$('.hidden').sidr({
    name: 'json-import-menu',
    source: '#json-import-menu',
    side: 'right',
    renaming: false,
    onOpen: function(){
        // Stuff happens here when menu opens.
    }
});

// Add New Button
// This function opens the new button menu.
function addNewButton(){
    $.sidr('open', 'button-menu');
}

// Game Profile List
// This function grabs a list of all saved game profiles and populates selection.
function gameProfileList() {
    try{
        var games = fs.readdirSync('./user-settings/controls');
    }catch(err){
        var games = 0;
    }

    if(games !== 0){
        $(".interactive-board-select option").each(function() {
            $(this).remove();
        });
        for (var i = 0, length = games.length; i < length; i++) {
            $(".interactive-board-select").append('<option value="' + games[i].split('.')[0] + '">' + games[i].split('.')[0] + '</option>');
        }

        // We have a profile! Show related buttons.
        $('.add-new-button, .delete-board, .launch-interactive, .import-board').fadeIn('fast');
    } else {
        // No control files found, delete anything in the dropdown.
        $(".interactive-board-select option").each(function() {
            $(this).remove();
        });

        // No profiles. Unneeded buttons.
        $('.add-new-button, .delete-board, .launch-interactive, .disconnect-interactive, .import-board').fadeOut('fast');

        // Force disconnected if they delete board while connected.
        ipcRenderer.send('beamInteractive', 'disconnect');
    }
    
    boardBuilder();
}

// Button Specific Controls
// This function shows or hides button specific controls in the button menu based on the button type selected.
function buttonSpecific(){
    var type = $('.button-type select option:selected').attr('data');
    $('.button-specific').css('display','none');
    $('.'+type).fadeIn('fast');
}

// Button Submission
// This function submits all of the button information to the controls file when save is pressed.
function buttonSubmission(){

    var validated = $("#new-button-form").valid();
    
    if (validated === true){
        var selectedBoard = $('.interactive-board-select').val();
        var dbControls = new JsonDB("./user-settings/controls/"+selectedBoard, true, false);

        // General settings
        var buttonID = $('.button-id input').val();
        var buttonType = $('.button-type select').val();
        var buttonCooldown = $('.button-cooldown input').val();
        var cooldownButtons = $('.button-cooldown-buddies input').val();
        var buttonNotes = $('.button-notes input').val();

        // Push general settings to db.
        dbControls.push("/tactile/" + buttonID, { "id": buttonID, "type": buttonType, "cooldown": buttonCooldown, "cooldownButtons": cooldownButtons, "notes": buttonNotes});

        // Button Specific settings
        if (buttonType == "Game Controls"){
            var buttonPressed = $('.game-button-pressed input').val();
            var buttonOpposite = $('.game-button-counter input').val();
            var typeSettings = { "press": buttonPressed, "opposite": buttonOpposite}

        } else if (buttonType == "Sound"){
            var filePath = $('.sound-file input').val();
            var fileVolume = $('.sound-volume input').val();
            var typeSettings = { "filePath": filePath, "volume": fileVolume}

        } else if (buttonType == "Api Buttons"){
            var apiType = $('.api-select select option:selected').val();
            var sendAs = $('.api-send-as select option:selected').val();
            var typeSettings = { "apiType": apiType, "sendAs":sendAs}

        } else if (buttonType == "Text Buttons"){
            var textLine = $('.text-line input').val();
            var whisperTo = $('.text-whisper-to input').val();
            var sendAs = $('.text-send-as select option:selected').val();
            var typeSettings = { "textLine": textLine, "sendAs":sendAs, "whisperTo":whisperTo}

        } else if (buttonType == "Nothing"){
            var typeSettings = {};

        }

        // Type Settings push to db.
        dbControls.push("/tactile/" + buttonID +"/typeSettings", typeSettings);

        // Build out the board.
        boardBuilder();

        // Reset Menu
        clearButtonMenu();
    }
}

// Add New Board Button
// This function opens the new board menu.
function addNewBoardButton(){
    $.sidr('open', 'board-menu');
}

// Remove Board Button
// This function deletes the current board.
function deleteBoardButton(){
    var boardName = $('.interactive-board-select').val();
    var filepath = './user-settings/controls/'+boardName+'.json';
    fs.exists(filepath, function(exists) {
        if(exists) {
                // File exists deleting
                fs.unlink(filepath,function(err){
                    gameProfileList();
                });
        } else {
            errorLogger.log("The board you tried to delete doesnt exist. Restart the app.")
            console.log("This file doesn't exist, cannot delete");
        }
    });
}

// New Board Submission
// This monitors new board button, and on press create a new controls file.
function newBoardSubmission(){
    var boardName = $('.board-name input').val();
    new JsonDB("./user-settings/controls/"+boardName, true, false);
    
    // Sync up profile list.
    gameProfileList();

    // Clear Menu
    clearButtonMenu();
}

// Board Builder
// Takes a look at the controls file and populates the board ui.
function boardBuilder(){
    $('.interactive-buttons').empty();
    var selectedBoard = $('.interactive-board-select').val();

    // If there is a board...
    if (selectedBoard !== null && selectedBoard !== undefined){
        var dbControls = new JsonDB("./user-settings/controls/"+selectedBoard, true, false);
        var tactile = dbControls.getData("tactile");
        var tactileButtons = tactile['tactile'];
        
        $.each(tactileButtons, function(){
            var buttonID = this.id;
            var buttonType = this.type;
            var buttonNotes = this.notes;
            
            var buttonTemplate = `<div class="iButton button${buttonID}">
                                    <div class="button-title">
                                        <div class="button-edit button-icon">
                                        <a href="#" class="button-edit-${buttonID}">
                                            <i class="fa fa-pencil-square-o" aria-hidden="true"></i>
                                        </a>
                                        </div>
                                        <div class="button-id button-icon">
                                        <span>ID:${buttonID}</span>
                                        </div>
                                        <div class="button-del button-icon">
                                        <a href="#" class="button-del-${buttonID}" data="${buttonID}">
                                            <i class="fa fa-minus-circle" aria-hidden="true"></i>
                                        </a>
                                        </div>
                                    </div>
                                    <div class="button-content">
                                        <div class="notes">${buttonNotes}</div>
                                        <div class="type">${buttonType}</div>
                                    </div>
                                </div>`;

                // Push template to ui.
                $('.interactive-buttons').append(buttonTemplate);

                // Bind click event to delete.
                $( ".button-del-"+buttonID ).click(function() {
                    try{
                        $('.button'+buttonID).remove();
                        dbControls.delete("/tactile/"+buttonID);
                    } catch(error){
                        errorLogger.log("There was an error deleting the button. Restart the app.")
                        console.log("Error deleting button.");
                    }
                });

                // Bind click event to edit.
                $( ".button-edit-"+buttonID ).click(function() {
                    editButton(buttonID);
                });

                // Save active board to json.
                var dbSettings = new JsonDB("./user-settings/settings", true, false);
                dbSettings.push("/interactive/activeBoard", selectedBoard);

        });
    }
}

// Edit Button
// This function grabs button details and populates the button menu.
function editButton(buttonID){
    var selectedBoard = $('.interactive-board-select').val();
    var dbControls = new JsonDB("./user-settings/controls/"+selectedBoard, true, false);
    var tactile = dbControls.getData("/tactile/"+buttonID);

    var buttonType = tactile.type;
    var buttonCooldown = tactile.cooldown;
    var cooldownButtons = tactile.cooldownButtons;
    var buttonNotes = tactile.notes;

    // Throw button info into button menu.
    $('.button-id input').val(buttonID);
    $('.button-type select').val(buttonType);
    $('.button-cooldown input').val(buttonCooldown);
    $('.button-cooldown-buddies input').val(cooldownButtons);
    $('.button-notes input').val(buttonNotes);

    // Show button specific menu based on the new type.
    buttonSpecific();

    // Now it's time to load up button type specific settings.
    var typeSettings = tactile.typeSettings;

    if(buttonType === "Game Controls"){
        var press = typeSettings.press;
        var opposite = typeSettings.opposite;
        $('.game-button-pressed input').val(press);
        $('.game-button-counter input').val(opposite);

    } else if (buttonType == "Sound"){
        var filepath = typeSettings.filePath;
        var volume = typeSettings.volume;
        $('.sound-file input').val(filepath);
        $('.sound-volume input').val(volume);

    } else if (buttonType == "Api Buttons"){
        var apiType = typeSettings.apiType;
        var sendAs = typeSettings.sendAs;
        $('.api-select select').val(apiType);
        $('.api-send-as select').val(sendAs);

    } else if (buttonType == "Text Buttons"){
        var textLine = typeSettings.textLine;
        var whisperTo = typeSettings.whisperTo;
        var sendAs = typeSettings.sendAs;
        $('.text-line input').val(textLine);
        $('.text-whisper-to input').val(whisperTo);
        $('.text-send-as select').val(sendAs);
        
    }

    // Open Menu
    $.sidr('open', 'button-menu');
}

// Clear Button Menu
// This function clears all of text in the button menu.
function clearButtonMenu(){
    $.sidr('close', 'board-menu');
    $.sidr('close', 'button-menu');
    $.sidr('close', 'json-import-menu');

    $('.sidr-inner input').val('');
    jqValidate.clearValidate('new-button-form');
}

// Connect/Disconnect UI Flipper
// Changes UI elements depending on if we're connected or disconnected from beam.
function connectFlipper(status){
    if(status == "disconnected"){
        $('.disconnect-interactive').fadeOut('fast', function(){
            $('.launch-interactive').fadeIn('fast');
            $('.interactive-status').removeClass('online');
            $('.chat-status').removeClass('online');
        });
    } else if (status == "connected"){
        $('.launch-interactive').fadeOut('fast', function(){
            $('.disconnect-interactive').fadeIn('fast');
            $('.interactive-status').addClass('online');
            $('.chat-status').addClass('online');
        });
    }
};

// Disconnected for chat
// Changes chat ui element if it disconnects or errors out.
function chatDisconnected(status){
    $('.chat-status').removeClass('online');
};

///////////
// Events
//////////

// Monitor Button Type select
// This monitors the button type selector to show or hide button specific controls.
$( ".button-type select" ).change(function() {
  buttonSpecific();
});

// Button Menu Toggle
// This monitors the add new button and runs a function to open up the button menu.
$( ".add-new-button" ).click(function() {
  addNewButton();
});

// Button Menu Save
// This monitors save button on the button menu and saves button info to controls file.
$( ".button-save" ).click(function() {
  buttonSubmission();
});

// Button Menu Cancel
// This monitors save button on the board menu and saves button info to controls file.
$( ".button-cancel" ).click(function() {
  clearButtonMenu();
});

// New Board Button
// This monitors the new board button and creates a new board on click.
$(".add-new-board").click(function(){
    addNewBoardButton();
});

// Delete Board Button
// This monitors the delete board button and deletes a new board on click.
$(".delete-board").click(function(){
    deleteBoardButton();
});

// Board Menu Save
// This monitors save button on the board menu and saves button info to controls file.
$( ".board-save" ).click(function() {
  newBoardSubmission();
});

// Board Menu Cancel
// This monitors save button on the board menu and saves button info to controls file.
$( ".board-cancel" ).click(function() {
  clearButtonMenu();
});

// Monitor Board Select
// This monitors the button type selector to show or hide button specific controls.
$( ".interactive-board-select" ).change(function() {
  boardBuilder();
});

// JSON Import Button
// This monitors the import json button and runs a function to open up the menu.
$( ".import-board" ).click(function() {
    $.sidr('open', 'json-import-menu');
});

// Import Menu Save
// This monitors save button on the board menu and saves button info to controls file.
$( ".import-save" ).click(function() {
    jsonImporter.convert();

    // Build out the board.
    boardBuilder();

    // Reset Menu
    clearButtonMenu();
});

// Import Menu Cancel
// This monitors the cancel button and closes the board menu.
$( ".import-cancel" ).click(function() {
  clearButtonMenu();
});

// Launch Interactive
// Launch interactive when button is clicked.
$( ".launch-interactive" ).click(function() {
    ipcRenderer.send('beamInteractive', 'connect');
});

// Disconnect Interactive
// Disconnect interactive when button is clicked.
$( ".disconnect-interactive" ).click(function() {
    ipcRenderer.send('beamInteractive', 'disconnect');
});

// Online and Offline Status
// Flips ui elements to online or offline depending on status.
ipcRenderer.on('beamInteractive', function (event, status){
    connectFlipper(status);
})

// Chat Disconnect
// Flips ui elements if chat disconnects due to error.
ipcRenderer.on('chat-disconnect', function (event, status){
    chatDisconnected();
})

// Kill Switch Toggle
// This recieves an event from the global killswitch in beam-connect.js, then sends an event back to confirm.
ipcRenderer.on('killSwitch', function (event, status){
    connectFlipper(status);
    if(status == "connect"){
        ipcRenderer.send('beamInteractive', 'connect');
    } else {
        ipcRenderer.send('beamInteractive', 'disconnect');
    }
})

///////////////////
// Run on App Start
///////////////////
gameProfileList();
boardBuilder()