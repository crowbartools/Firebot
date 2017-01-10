// Requirements
const fs = require('fs');
const JsonDB = require('node-json-db');

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

// Add New Button
// This function opens the new button menu.
function addNewButton(){
    $.sidr('open', 'button-menu');
}

// Game Profile List
// This function grabs a list of all saved game profiles and populates selection.
function gameProfileList() {
    var games = fs.readdirSync('./user-settings/controls');
    if(games.length !== 0){
        $(".interactive-board-select option").each(function() {
            $(this).remove();
        });
        for (var i = 0, length = games.length; i < length; i++) {
            $(".interactive-board-select").append('<option value="' + games[i].split('.')[0] + '">' + games[i].split('.')[0] + '</option>');
        }
    }
}

// Button Specific Controls
// This function shows or hides button specific controls in the button menu based on the button type selected.
function buttonSpecific(){
    var type = $('.button-type select').val();
    $('.button-specific').css('display','none');
    $('.'+type).fadeIn('fast');
}

// Button Submission
// This function submits all of the button information to the controls file when save is pressed.
function buttonSubmission(){
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
    if (buttonType == "game-controls"){
        var buttonPressed = $('.game-button-pressed input').val();
        var buttonOpposite = $('.game-button-counter input').val();
        var typeSettings = { "press": buttonPressed, "opposite": buttonOpposite}
    }

    // Type Settings push to db.
    dbControls.push("/tactile/" + buttonID +"/typeSettings", typeSettings);

    // Close menu.
    $.sidr('close', 'button-menu');
}

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

///////////////////
// Run on App Start
///////////////////
gameProfileList();