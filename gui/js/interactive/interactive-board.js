const fs = require('fs');

// Import Board Modal
// This grabs the version id from the new board modal and passes it off.
function importBoardModal(){

    // Get version code, trim it, and check for length.
    var versionid = $('.add-new-board-code').val().trim();

    // Send it off to import board function.
    boardBuilder(versionid);

    // Clear version field and close the modal.
    $('.add-new-board-code').val('');

};

// Board Builder
// This takes the interactive json and throws all the buttons onto the board.
function boardBuilder(versionid){

    // Hit up Beam for the latest json.
    $.getJSON( "https://beam.pro/api/v1/interactive/versions/"+versionid, function( data ) {
        var gameName = data.game.name;
        var gameJson = data.controls.scenes;

        // Push to Json
        backendBuilder(gameName, gameJson, versionid);

        // Add to board menu.
        menuManager();

    });
}

// Backend Controls Builder
// This takes the beam json and builds out the structure for the controls file.
function backendBuilder(gameName, gameJson, versionid){
    var dbControls = new JsonDB("./user-settings/controls/"+gameName, true, true);

    // Push Beam Json to controls file.
    dbControls.push('/versionid', parseInt(versionid) );
    dbControls.push('/beam', gameJson);
    
    // Build Firebot controls
    for (var i = 0; i < gameJson.length; i++) {
        var sceneControls = gameJson[i].controls;

        // Loop through controls for this scene.
        for (var a = 0; a < sceneControls.length; a++) { 
            var button = sceneControls[a];

            // Try to get info for button. If there is nothing it errors out.
            try{
                var type = button.kind;
                if(type == "button"){
                    try{
                        var controlID = button.controlID;
                    }catch(err){}
                    try{
                        var text = button.text;
                    }catch(err){
                        var text="None"
                    }
                    try{
                        var cost = button.cost;
                    }catch(err){
                        var cost = 0;
                    }
                }
                // Push to db
                dbControls.push('/firebot/controls/'+controlID+'/text', controlID);
                dbControls.push('/firebot/controls/'+controlID+'/text', text);
                dbControls.push('/firebot/controls/'+controlID+'/cost', cost);
            }catch(err){
                console.log('Problem getting button info to save to json.')
            };
        }
    }

    // Next step, setup the ui using the controls file.
    sceneBuilder(gameName);
}

// UI Controls Builder
// This takes info and builds out scenes.
function sceneBuilder(gameName){
    var dbControls = new JsonDB("./user-settings/controls/"+gameName, true, true);
    var scenes = dbControls.getData('/beam');

    // Template for tabs.
    var boardTemplate = `
    <ul class="nav nav-tabs interactive-tab-nav" role="tablist">
        <li role="presentation" class="active"><a href="#settings" aria-controls="settings" role="tab" data-toggle="tab">Settings</a></li>
    </ul>
    <div class="tab-content">
        <div role="tabpanel" class="tab-pane active" id="settings">
            <div class="general-board-settings">
                <h3>General Settings</h3>
                <div class="board-group-defaults">
                    Here we'll list out each scene and put a dropdown next to it to you can pick your default scene for each group.
                </div>
            </div>
            <div class="board-cooldown-group-settings">
                <h3>Cooldown Groups</h3>
                <div class="board-group-defaults">
                    Here we'll list out all button id's with the ability to drag them to cooldown groups you create.
                </div>
            </div>
        </div>
    </div>
    `;

    // Throw template on page.
    $('.interactive-board-container').html(boardTemplate);

    // Throw the board title onto the page.
    $('.board-title a').attr('href', 'https://beam.pro/i/studio').text(gameName);

    // Set as last used board.
    var dbSettings = new JsonDB("./app-settings/settings", true, true);
    dbSettings.push('/interactive/lastBoard', gameName);

    // For every scene in the JSON put in a tab.
    for (var i = 0; i < scenes.length; i++) { 
        $('.interactive-tab-nav').append('<li role="presentation"><a href="#'+i+'-scene" aria-controls="'+i+'-scene" scene="'+scenes[i].sceneID+'" role="tab" data-toggle="tab">'+scenes[i].sceneID+'</a></li>');
        $('.tab-content').append('<div role="tabpanel" class="tab-pane interactive-button-holder" id="'+i+'-scene" scene="'+scenes[i].sceneID+'"></div>');
    }

    // Initialize the tab menu.
    $('.interactive-tab-nav a').click(function (e) {
        e.preventDefault()
        $(this).tab('show')
    })

    // Next Step: Start up the button builder
    buttonBuilder(scenes);
};

// Button Builder
// This takes the scenes json and puts in all of the buttons.
function buttonBuilder(scenes){

    // Loop through scenes
    for (scene of scenes){
        var sceneName = scene.sceneID;
        var controls = scene.controls;

        // Loop through controls for that scene.
        for(button of controls){
            var controlType = button.kind;

            // If this control is a button...
            if(controlType == "button"){
                var controlID = button.controlID;
                var buttontext = button.text;
                var sparkcost = button.cost;

                // If there is no cost or name, just put in placeholders.
                if(buttontext === undefined){
                    var buttontext = 'Unnamed';
                }
                if(sparkcost === undefined){
                    var sparkcost = 0;
                }

                // The html template for the buttons.
                var buttonTemplate = `
                    <div class="interactive-button col-sm-6 col-md-3">
                        <div class="controlID">${controlID}</div>
                        <div class="buttontext">${buttontext}</div>
                        <div class="sparkcost"><i class="fa fa-bolt button-title-spark" aria-hidden="true"></i> ${sparkcost}</div>
                        <div class="edit-interactive-control"><button class="edit-control btn btn-default" controlid="${controlID}">Edit</button></div>
                    </div>
                `;

                // Throw button on the correct pane.
                $('.interactive-board-container .tab-content .tab-pane[scene="'+sceneName+'"]').append(buttonTemplate);
            }
        }
    }

    // Initialize click event for all edit buttons.
    $( ".edit-control" ).click(function() {
        // Get the controlId and pass it off to the edit function.
        var controlId = $(this).attr('controlid');
        editButton(controlId); // This function is in controls-editor.js.
    });
}

// Menu Manager
// This updates the boards listed in the select a board menu.
function menuManager(){
    // Look into the controls directory. Make an array of filenames.
    try{
        var games = fs.readdirSync('./user-settings/controls');
    }catch(err){
        var games = [];
    }

    // Clean up dropdown
    $('.dropdownGame').remove();
    $('.interactive-menu .divider').hide();

    // Check to see if the games list is empty.
    if(games.length !== 0){
        // Not empty, we have boards!
        for (var i = 0, length = games.length; i < length; i++) {
            // Clean up the current dropdown items.
            $('.interactive-menu .divider').show();
            // Build the dropdown template.
            var dropdownTemplate = `<li><a href="#" class="dropdownGame" gameName="${games[i].split('.')[0]}">${games[i].split('.')[0]}</a></li>`;
            // Put games into the list.
            $('.interactive-menu').append(dropdownTemplate);
        }

        // Initialize games in dropdown menu.
        gameSelector();
    } else {
        // Empty, sad day.
    }
}

// Game Selector
// This initializes games in dropdown list to load game on click.
function gameSelector(){
    $( ".dropdownGame" ).click(function() {
        var gameName = $(this).attr('gamename');
        try{
            // Get settings.
            var dbControls = new JsonDB("./user-settings/controls/"+gameName, true, true);
            var versionid = dbControls.getData('/versionid');

            // Pull new json from beam.
            boardBuilder(versionid);        
        } catch(err){};
    });
}

// Last Board Loader
// This loads up the last board that was selected.
function loadLastBoard(){
    var dbSettings = new JsonDB("./app-settings/settings", true, true);

    try{
        // Get last board name.
        var gameName = dbSettings.getData('/interactive/lastBoard');

        // Get settings for last board.
        var dbControls = new JsonDB("./user-settings/controls/"+gameName, true, true);
        var versionid = dbControls.getData('/versionid');

        // Pull new json from beam.
        boardBuilder(versionid);        
    } catch(err){};
}

// Delete Board
// This deletes the currently selected board on confirmation.
function deleteBoard(){
    var dbSettings = new JsonDB("./app-settings/settings", true, true);

    // Check for last board and load ui if one exists.
    try{
        var gameName = dbSettings.getData('/interactive/lastBoard');
        var filepath = './user-settings/controls/'+gameName+'.json';

        fs.exists(filepath, function(exists) {
            if(exists) {
                    // File exists deleting
                    fs.unlink(filepath,function(err){
                        clearBoard();
                    });
            } else {
                console.log("This file doesn't exist, cannot delete");
            }
        });
    } catch(err){};
}

// Board Clear
// This clears all of the information out of the UI for the current board.
function clearBoard(){
    menuManager();
    $('.board-title a').text('');
    $('.interactive-board-container').empty();
}

//////////////////////
// On Click Functions
/////////////////////

// Kick off import script on save button press.
$( ".add-new-board-save" ).click(function() {
    importBoardModal();
});

// Delete current board
$( ".deleteBoard" ).click(function() {
    deleteBoard();
});

////////////////////////
// On App Load Functions
////////////////////////

// Load up last board and organize game list.
menuManager();
loadLastBoard();