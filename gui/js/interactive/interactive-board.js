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
    name: 'cooldown-menu',
    source: '#cooldown-menu',
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
        var games = [];
    }

    if(games.length !== 0){
        $(".interactive-board-select option").each(function() {
            $(this).remove();
        });
        for (var i = 0, length = games.length; i < length; i++) {
            $(".interactive-board-select").append('<option value="' + games[i].split('.')[0] + '">' + games[i].split('.')[0] + '</option>');
        }

        // We have a profile! Show related buttons.
        $('.add-new-button, .delete-board, .launch-interactive, .import-board, .add-new-cooldown-group').fadeIn('fast');
    } else {
        // No control files found, delete anything in the dropdown.
        $(".interactive-board-select option").each(function() {
            $(this).remove();
        });

        // No profiles. Unneeded buttons.
        $('.add-new-button, .delete-board, .launch-interactive, .disconnect-interactive, .import-board, .add-new-cooldown-group').fadeOut('fast');

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
        var buttonID = parseInt( $('.button-id input').val() );
        var buttonType = $('.button-type select').val();
        var buttonCooldown = convertTime( $('.button-cooldown input').val() );
        var buttonNotes = $('.button-notes input').val();

        // See if we're editing a button, if we are we want to keep the cooldown group.
        try{
            var cooldownGroup = dbControls.getData('/tactile/'+buttonID+'/cooldownGroup');
        } catch(err){
            var cooldownGroup = "solo";
        }
        
        // Push general settings to db.
        dbControls.push("/tactile/" + buttonID, { "id": buttonID, "type": buttonType, "cooldownGroup": cooldownGroup, "cooldown": buttonCooldown, "notes": buttonNotes});

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

// Convert to Milliseconds
// This takes a number in seconds and converts it to Milliseconds
function convertTime(time){
    if (time !== ""){
        var newTime = parseInt( time ) * 1000;
        return newTime;
    } else {
        return 0;
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
    // Wipe the slate clean.
    $('.interactive-buttons .cooldown-group-wrap').not('.solo-wrap').remove();
    $('.cooldown-group li').remove();

    // Now lets start...
    var selectedBoard = $('.interactive-board-select').val();

    // If there is a board...
    if (selectedBoard !== null && selectedBoard !== undefined){
        // Save active board to json.
        var dbSettings = new JsonDB("./user-settings/settings", true, false);
        dbSettings.push("/interactive/activeBoard", selectedBoard);
        var dbControls = new JsonDB("./user-settings/controls/"+selectedBoard, true, false);

        // Lets put our cooldown groups on the page first.
        cooldownUIBuilder();

        var tactile = dbControls.getData("tactile");
        var tactileButtons = tactile['tactile'];
        
        $.each(tactileButtons, function(){
            var buttonID = this.id;
            var buttonType = this.type;
            var buttonNotes = this.notes;
            var buttonCooldownGroup = this.cooldownGroup;
            
            var buttonTemplate = `<li class="iButton button${buttonID} col-sm-6 col-md-3 col-lg-2" data=${buttonID}>
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
                                </li>`;

                // Push template to ui.
                if (buttonCooldownGroup !== "solo") {
                    // This button is in a group.
                    $('.interactive-buttons .group-'+buttonCooldownGroup).append(buttonTemplate);
                } else {
                    // This button is a solo button.
                    $('.interactive-buttons .solo-group').append(buttonTemplate);
                }

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
    var buttonCooldown = tactile.cooldown / 1000;
    var cooldownButtons = tactile.cooldownButtons;
    var buttonNotes = tactile.notes;

    // Throw button info into button menu.
    $('.button-id input').val(buttonID);
    $('.button-type select').val(buttonType);
    $('.button-cooldown input').val(buttonCooldown);
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
    $.sidr('close', 'cooldown-menu');

    $('.sidr-inner input').val('');
    jqValidate.clearValidate('new-button-form');
}

// Add New Cooldown Group 
// This adds a new cooldown group and sets it up so items can be dragged into it.
function newCooldownGroup(){
    var selectedBoard = $('.interactive-board-select').val();
    var dbControls = new JsonDB("./user-settings/controls/"+selectedBoard, true, false);

    // See if there are any groups already. If not, push the first one to the controls file.
    // If there are then increment that by one.
    try{
        var groupid = dbControls.getData('/cooldowns/groupCount');
        var groupid = groupid + 1;
        dbControls.push('/cooldowns/groupCount', groupid);
    }catch(err){
        var groupid = 1;
        dbControls.push('/cooldowns/groupCount', groupid);
    }

    // Set default cooldown and push value to JSON for that group.
    var cooldownTime = 5000;
    dbControls.push("/cooldowns/"+groupid+"/cooldown", cooldownTime);
    dbControls.push("/cooldowns/"+groupid+"/id", groupid);
    dbControls.push("/cooldowns/"+groupid+"/buttons", []);

    // Rebuild Board
    boardBuilder();
}

// Cooldown UI Builder
// This puts the cooldown group UI elements onto the page.
function cooldownUIBuilder(){
    // Check to see if this board has cooldown groups on it, otherwise ignore.
    try{
        var selectedBoard = $('.interactive-board-select').val();
        var dbControls = new JsonDB("./user-settings/controls/"+selectedBoard, true, false);
        var cooldownGroups = dbControls.getData('/cooldowns');

        // Loop through cooldown boards
        $.each(cooldownGroups, function(i, val){
            var groupid = val.id;
            
            if(groupid !== undefined){
                var cooldownTime = dbControls.getData('/cooldowns/'+groupid+'/cooldown');
                var cooldownTime = cooldownTime / 1000;

                // Build the template
                var cooldownTemplate = `<div class="cooldown-group-wrap group-${groupid}-wrap col-12">
                                            <div class="cooldown-group-title">
                                                <div class="cooldown-edit cooldown-icon">
                                                    <a href="#" class="cooldown-edit-${groupid}">
                                                        <i class="fa fa-pencil-square-o" aria-hidden="true"></i>
                                                    </a>
                                                </div>
                                                <div class="cooldown-group-info cooldown-icon">
                                                    <span class="cooldown-id">Cooldown group for ${cooldownTime} seconds.</span>
                                                </div>
                                                <div class="cooldown-del cooldown-icon">
                                                    <a href="#" class="cooldown-del-${groupid}" data="${groupid}">
                                                        <i class="fa fa-minus-circle" aria-hidden="true"></i>
                                                    </a>
                                                </div>
                                            </div>
                                            <ul class="cooldown-group group-${groupid}" data="${groupid}"></ul>
                                        </div>`;

                // Put at bottom of interactive board page.
                $('.interactive-buttons').append(cooldownTemplate);

                // Bind click event to edit.
                $( ".cooldown-edit-"+groupid ).click(function() {
                    editCooldown(groupid);
                });

                // Bind click event to delete.
                $( ".cooldown-del-"+groupid ).click(function() {
                    try{
                        // Cycle through buttons in that cooldown group and move them to the individual cooldown group.
                        $('.group-'+groupid+'-wrap .cooldown-group li').each(function( index ) {
                            $(this).appendTo('ul.solo-group');
                        });

                        // Delete old group from ui.
                        $('.group-'+groupid+'-wrap').remove();

                        // Trigger receive event for sortable to grab new items.
                        var widget = $('.cooldown-group').data('ui-sortable');
                        if (widget) widget._trigger("receive", null, widget._uiHash(widget));

                        // Delete group from controls file.
                        dbControls.delete("/cooldowns/"+groupid);
                        
                        // Rebuild Progress Reports 
                        cooldownProgressBuilder();
                    } catch(error){
                        // errorLogger.log("There was an error deleting the cooldown group. Restart the app.")
                        console.log("Error deleting cooldown group from JSON or it didn't exist.");
                    }
                });
            };
        });

        // Okay, we're done looping. Setup our sortable lists.
        // Setup sortable lists.
        $( ".cooldown-group" ).sortable({
        connectWith: ".cooldown-group",
        receive: function(event, ui){
            cooldownProgressBuilder()
        }
        }).disableSelection();
    }catch(err){
        // No cooldown groups on this board yet.
    }
}

// Cooldown Progress Builder
// This waits for the user to stop sorting items on the interactive page.
// Once done it looks at all buttons and builds the tactile cooldown for storage in controls file.
function cooldownProgressBuilder(){
    var selectedBoard = $('.interactive-board-select').val();
    var dbControls = new JsonDB("./user-settings/controls/"+selectedBoard, true, false);

    var cooldownGroups = dbControls.getData("/cooldowns");
    $.each(cooldownGroups, function(i, val){
        var groupid = val.id;
        if(groupid !== undefined){
            dbControls.delete("/cooldowns/"+groupid+"/buttons");
        }
    });

    // For each button in each group
    $('.cooldown-group li').each(function( index ) {
        // Get Button ID and group number.
        var buttonid = $(this).attr('data');
        var groupid = $(this).closest('.cooldown-group').attr('data');

        // Then push this info to the appropriate cooldown group if it isn't a "solo" button.
        if (groupid !== "solo"){
            // Push this info to the controls file for the button.
            dbControls.push("/tactile/"+buttonid+"/cooldownGroup", groupid);
            
            // Push button id to buttons array for this cooldown group.
            dbControls.push("/cooldowns/"+groupid+"/buttons[]", parseInt(buttonid));

            // Clean the array of duplicates.
            var currentArray = dbControls.getData("/cooldowns/"+groupid+"/buttons")
            var cleanArray = remove_duplicates(currentArray);

            // Push Final
            dbControls.push("/cooldowns/"+groupid+"/buttons", cleanArray);
        } else {
            // Push this info to the controls file for the button.
            dbControls.push("/tactile/"+buttonid+"/cooldownGroup", groupid);
        }
    });
}

// Remove Duplicates from array
// This checks an array and removes any duplicates.
function remove_duplicates(objectsArray) {
    var usedObjects = {};
    for (var i=objectsArray.length - 1;i>=0;i--) {
        var so = JSON.stringify(objectsArray[i]);
        if (usedObjects[so]) {
            objectsArray.splice(i, 1);
        } else {
            usedObjects[so] = true;          
        }
    }
    return objectsArray;
}

// New Cooldown Submission 
// This takes the value in the current cooldown field and saves it for that group.
function newCooldownSubmission(){
    var selectedBoard = $('.interactive-board-select').val();
    var dbControls = new JsonDB("./user-settings/controls/"+selectedBoard, true, false);

    // Get info from menu
    var groupid = $('.cooldown-amount input').attr('data');
    var cooldown = $('.cooldown-amount input').val();
    var cooldown = cooldown * 1000;

    // submits
    dbControls.push("/cooldowns/"+groupid+"/cooldown", cooldown)
}

// Edit Cooldown
// This function throws the cooldown amount for this group into a side menu and opens it.
function editCooldown(groupid){
    var selectedBoard = $('.interactive-board-select').val();
    var dbControls = new JsonDB("./user-settings/controls/"+selectedBoard, true, false);
    var cooldown = dbControls.getData("/cooldowns/"+groupid+"/cooldown");
    var cooldown = cooldown / 1000;

    // Throw button info into button menu.
    $('.cooldown-amount input').val(cooldown);

    // Put group id on data for input so we can use it when saving.
    $('.cooldown-amount input').attr('data',groupid);

    // Open Menu
    $.sidr('open', 'cooldown-menu');
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

// Cooldown Group Add
// This monitors the cooldown add button and adds a new cooldown group to the page.
$( ".add-new-cooldown-group" ).click(function() {
    newCooldownGroup();
});

// Cooldown Save
// This monitors save button on the cooldown menu and saves button info to controls file.
$( ".cooldown-save" ).click(function() {
    newCooldownSubmission()

    // Build out the board.
    boardBuilder();

    // Reset Menu
    clearButtonMenu();
});

// Cooldown Cancel
// This monitors save button on the board menu and saves button info to controls file.
$( ".cooldown-cancel" ).click(function() {
  clearButtonMenu();
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