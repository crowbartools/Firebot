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

    // Build out the board.
    boardBuilder();

    // Close menu.
    $.sidr('close', 'button-menu');
}

// Add New Board Button
// This function opens the new board menu.
function addNewBoardButton(){
    $.sidr('open', 'board-menu');
}

// New Board Submission
// This monitors new board button, and on press create a new controls file.
function newBoardSubmission(){
    var boardName = $('.board-name input').val();
    fs.writeFile('./user-settings/controls/'+boardName+'.json',"{}", function (err) {
        if(err){
            alert("An error ocurred creating the file "+ err.message)
        }
        
        // Sync up profile list.
        gameProfileList();
        
        // Build out the board.
        boardBuilder();

        // Close menu
        $.sidr('close', 'board-menu');
    });
}

// Board Builder
// Takes a look at the controls file and populates the board ui.
function boardBuilder(){
    $('.interactive-buttons').empty();

    var selectedBoard = $('.interactive-board-select').val();
    var dbControls = new JsonDB("./user-settings/controls/"+selectedBoard, true, false);
    var tactile = dbControls.getData("tactile");
    var tactileButtons = tactile['tactile'];
    
    $.each(tactileButtons, function(){
        var buttonID = this.id;
        var buttonType = this.type;
        var buttonNotes = this.notes;
        
        var buttonTemplate = `<div class="iButton button${buttonID}">
                                <div class="button-title">
                                    <div class="button-log button-icon">
                                    <a href="#">
                                        <i class="fa fa-list" aria-hidden="true"></i>
                                    </a>
                                    </div>
                                    <div class="button-edit button-icon">
                                    <a href="#">
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
                                    <div class="type">${buttonType}</div>
                                    <div class="notes">${buttonNotes}</div>
                                </div>
                               </div>`;

            // Push template to ui.
            $('.interactive-buttons').append(buttonTemplate);

            // Bind click event to delete.
            $( ".button-del-"+buttonID ).click(function() {
                $('.button'+buttonID).remove();
                 dbControls.delete("/tactile/"+buttonID);
            });
    });
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

// New Board Button
// This monitors the new board button and creates a new board on click.
$(".add-new-board").click(function(){
    addNewBoardButton();
});

// Board Menu Save
// This monitors save button on the board menu and saves button info to controls file.
$( ".board-save" ).click(function() {
  newBoardSubmission();
});

// Monitor Board Select
// This monitors the button type selector to show or hide button specific controls.
$( ".interactive-board-select" ).change(function() {
  boardBuilder();
});

///////////////////
// Run on App Start
///////////////////
gameProfileList();
boardBuilder()