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

        // We have a profile! Show related buttons.
        $('.add-new-button, .delete-board').fadeIn('fast');
    } else {
        // No control files found, delete anything in the dropdown.
        $(".interactive-board-select option").each(function() {
            $(this).remove();
        });

        // No profiles. Unneeded buttons.
        $('.add-new-button, .delete-board').fadeOut('fast');
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
    if (buttonType == "Game Controls"){
        var buttonPressed = $('.game-button-pressed input').val();
        var buttonOpposite = $('.game-button-counter input').val();
        var typeSettings = { "press": buttonPressed, "opposite": buttonOpposite}
    }

    // Type Settings push to db.
    dbControls.push("/tactile/" + buttonID +"/typeSettings", typeSettings);

    // Build out the board.
    boardBuilder();

    // Reset Menu
    clearButtonMenu();
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
                // File exists deletings
                fs.unlink(filepath,function(err){
                    gameProfileList();
                });
        } else {
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
                                        <div class="button-log button-icon">
                                        <a href="#">
                                            <i class="fa fa-list" aria-hidden="true"></i>
                                        </a>
                                        </div>
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
                        console.log("Error deleting buton.");
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

    // Open Menu
    $.sidr('open', 'button-menu');
}

// Clear Button Menu
// This function clears all of text in the button menu.
function clearButtonMenu(){
    $.sidr('close', 'board-menu');
    $.sidr('close', 'button-menu');

    $('.sidr-inner input').val('');
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

///////////////////
// Run on App Start
///////////////////
gameProfileList();
boardBuilder()