const fs = require('fs');
const {ipcRenderer} = require('electron');

// Import Board Modal
// This grabs the version id from the new board modal and passes it off.
function importBoardModal(){

    // Get version code, trim it, and check for length.
    var versionid = $('.add-new-board-code').val().trim();

    // Send it off to import board function.
    if(versionid !== ""){
        boardBuilder(versionid);
    }

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
        var scenename = gameJson[i].sceneID;
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
                dbControls.push('./firebot/controls/'+controlID+'/controlId', controlID);
                dbControls.push('./firebot/controls/'+controlID+'/scene', scenename);
                dbControls.push('./firebot/controls/'+controlID+'/text', text);
                dbControls.push('./firebot/controls/'+controlID+'/cost', cost);
            }catch(err){
                console.log('Problem getting button info to save to json.')
            };

            // Setup scenes in Firebot json if they haven't been made yet.
            try{
                dbControls.getData('./firebot/scenes/'+scenename);
            }catch(err){
                dbControls.push('./firebot/scenes/'+scenename+'/sceneName', scenename);
                dbControls.push('./firebot/scenes/'+scenename+'/default', 'None');
            }
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
        <li role="presentation" class="active"><a href="#board-settings" aria-controls="board-settings" role="tab" data-toggle="tab">Settings</a></li>
    </ul>
    <div class="tab-content">
        <div role="tabpanel" class="tab-pane active" id="board-settings">
            <div class="general-board-settings">
                <h3>General Settings</h3>
                <div class="board-group-defaults">
                    <p>Here you can specify which scenes certain groups use as their "default".</p>
                    <div class="board-group-defaults-settings clearfix">
                    </div>
                </div>
            </div>
            <div class="board-cooldown-group-settings">
                <h3>Cooldown Groups <button class="btn btn-default add-new-cooldown-group" data-toggle="modal" data-target="#new-cooldown-group-modal">Add New</button></h3>
                <div class="board-cooldown-content">
                    <p>Cooldown groups make it easy to group multiple buttons together so that they all cooldown anytime one is clicked.</p>
                    <div class="board-cooldown-groups">

                    </div>
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

    // Initialize cooldown group button.
    $( ".add-new-cooldown-group" ).click(function() {
        addCooldownGroup()
    });

    // Add in the board settings.
    boardGroupSettings(scenes);

    // Next Step: Load up the cooldown groups.
    loadCooldownGroups();

    // Next Step: Start up the button builder
    buttonBuilder(scenes);
    
};

// Board General Group Settings
// This puts all scenes into the general board settings along with a dropdown so you can set defaults.
function boardGroupSettings(scenes){
    var dbControls = getCurrentBoard();

    // Loop through scenes
    for (scene of scenes){
        var uniqueid = getUniqueId();
        var sceneName = scene.sceneID;

        // Look to see if we have saved settings for this one.
        try{
            var sceneSettings = dbControls.getData('/firebot/scenes/'+sceneName);
            var selectedOption = sceneSettings.default;
        }catch(err){
            var selectedOption = "None"
        }

        var groupSettingTemplate = `
            <div class="board-group board-group${uniqueid} tile no-top col-sm-6 col-md-3">
                <div class="tile-header">
                    <div class="board-groupscene">${sceneName}</div>
                </div>
                <div class="board-group-scene-body tile-body">
                    <div class="board-group-scene-dropdown">
                        <div class="dropdown">
                            <button class="btn btn-default dropdown-toggle" type="button" id="sceneGroupDropdown" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
                                <span class="selected-scene-group">${selectedOption}</span>
                                <span class="caret"></span>
                            </button>
                            <ul class="dropdown-menu scene-group-dropdown" aria-labelledby="sceneGroupDropdown">
                                <li><a href="#" uniqueid="${uniqueid}">None</a></li>
                                <li><a href="#" uniqueid="${uniqueid}">Default</a></li>
                                <li><a href="#" uniqueid="${uniqueid}">Pro</a></li>
                                <li><a href="#" uniqueid="${uniqueid}">Subscribers</a></li>
                                <li><a href="#" uniqueid="${uniqueid}">Moderators</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Throw it onto the page.
        $('.board-group-defaults-settings').append(groupSettingTemplate);

        // Load up all custom made groups in each dropdown.
        var dbGroup = new JsonDB("./user-settings/groups", true, true);
        try{
            var groups = dbGroup.getData('/');
            for (var group in groups){
                var template = `
                    <li><a href="#" uniqueid="${uniqueid}">${group}</a></li>
                `;
                $('.board-group'+uniqueid+' .scene-group-dropdown').append(template);
            }
        }catch(err){console.log(err)};


        // When an effect is clicked, change the dropdown title.
        $( ".scene-group-dropdown a" ).click(function() {
            var text = $(this).text();
            var uniqueid = $(this).attr('uniqueid');
            $(".board-group"+uniqueid+" .selected-scene-group").text(text);

            //Push update to json db.
            var scene = $(this).closest('.board-group').find('.board-group-scene').text();
            dbControls.push('./firebot/scenes/'+scene+'/default', text);
            dbControls.push('./firebot/scenes/'+scene+'/sceneName', scene);
        });
    }
}

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
                    <div class="interactive-button tile col-sm-6 col-md-3">
                        <div class="interactive-button-header tile-header">
                            <div class="controlID tileID pull-left">${controlID}</div>
                            <div class="edit-interactive-control tile-edit pull-right">
                                <button class="edit-control btn btn-default" controlid="${controlID}">
                                    <i class="fa fa-pencil" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>
                        <div class="interactive-button-body tile-body">
                            <div class="buttontext">${buttontext}</div>
                            <div class="sparkcost"><i class="fa fa-bolt button-title-spark" aria-hidden="true"></i> ${sparkcost}</div>
                        </div>
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

// Add Cooldown Group
// This controls the actions on the cooldown group module.
function addCooldownGroup(){
    // Clear old settings.
    $(".cooldown-groupid").val('');
    $(".cooldown-group-length").val('');
    $(".selected-cooldown-group-buttons").empty();
    $('.cooldown-group-dropdown').empty();

    // Pull in all buttons for selected board.
    try{
        // Get settings for last board.
        var dbControls = getCurrentBoard();

        // Get settings for this button.
        var scenes = dbControls.getData('./beam');

        // Loop through scenes and put buttons into dropdown menu.
        for (scene of scenes){
            var controls = scene.controls;
            for (button of controls){
                var name = button.controlID;
                var dropdowntemplate = `<li><a href="#">${name}</a></li>`;
                $(".cooldown-group-dropdown").append(dropdowntemplate);
            }
        }
    } catch(err){};

    // Add in a new button when one is selected.
    $( ".cooldown-group-dropdown a" ).click(function() {
        var text = $(this).text();
        var template = `<div class="selected-cooldown-group-button pill">
                            <p class="content"><span>${button}</span></p>
                            <div class="remove-cooldown-group-button pull-right">
                                <button class="btn btn-danger">X</button>
                            </div>
                        </div>`;
        $(".selected-cooldown-group-buttons").append(template);

        // When X is clicked, remove button from list.
        $(".remove-cooldown-group-button button").click(function(){
            $(this).closest(".selected-cooldown-group-button").remove();
        });
    });
}

// Edit Cooldown Group
// This will fill in info on the cooldown group so it can be edited.
function editCooldownGroup(sceneid){
    var dbControls = getCurrentBoard();
    var scene = dbControls.getData('./firebot/cooldownGroups/'+sceneid);
    var length = scene.length;
    var buttons = scene.buttons;

    // Clear old settings.
    $(".cooldown-groupid").val('');
    $(".cooldown-group-length").val('');
    $(".selected-cooldown-group-buttons").empty();
    $('.cooldown-group-dropdown').empty();


    // Load easy info
    $('.cooldown-groupid').val(sceneid);
    $('.cooldown-group-length').val(length);

    // Loop through buttons and add them in.
    for (button of buttons){
        var template = `<div class="selected-cooldown-group-button pill">
                            <p class="content"><span>${button}</span></p>
                            <div class="remove-cooldown-group-button pull-right">
                                <button class="btn btn-danger">X</button>
                            </div>
                        </div>`;
        $(".selected-cooldown-group-buttons").append(template);
    }

    // Pull in all buttons for selected board.
    try{
        // Get settings for last board.
        var dbControls = getCurrentBoard();

        // Get settings for this button.
        var scenes = dbControls.getData('./beam');

        // Loop through scenes and put buttons into dropdown menu.
        for (scene of scenes){
            var controls = scene.controls;
            for (button of controls){
                var name = button.controlID;
                var dropdowntemplate = `<li><a href="#">${name}</a></li>`;
                $(".cooldown-group-dropdown").append(dropdowntemplate);
            }
        }
    } catch(err){};

    // Add in a new button when one is selected.
    $( ".cooldown-group-dropdown a" ).click(function() {
        var text = $(this).text();
        var template = `<div class="selected-cooldown-group-button pill">
                            <p class="content"><span>${button}</span></p>
                            <div class="remove-cooldown-group-button pull-right">
                                <button class="btn btn-danger">X</button>
                            </div>
                        </div>`;
        $(".selected-cooldown-group-buttons").append(template);

        // When X is clicked, remove button from list.
        $(".remove-cooldown-group-button button").click(function(){
            $(this).closest(".selected-cooldown-group-button").remove();
        });
    });

    // Show Modal
    $('#new-cooldown-group-modal').modal('toggle')
}

// Save Cooldown Group
// This takes settings for cooldown group modal and saves it.
function saveCooldownGroup(){
    var dbControls = getCurrentBoard();
    var cooldownButtons = [];

    // Get group id.
    var groupID = $('.cooldown-groupid').val();
    var cooldownLength = $('.cooldown-group-length').val();

    // Loop through selected buttons and get control id.
    $( ".selected-cooldown-group-buttons" ).find('.selected-cooldown-group-button').each(function( index ) {
        var text = $(this).find('span').text();
        cooldownButtons.push(text);

        // Push group info to db for each control.
        dbControls.push('./firebot/controls/'+text+'/cooldownGroup', groupID);
    });

    // Push cooldown group info to db.
    dbControls.push('./firebot/cooldownGroups/'+groupID, {groupName: groupID, length: cooldownLength, buttons: cooldownButtons});

    // reload groups
    loadCooldownGroups();
}

// Load Cooldown Group
// This goes through the cooldown group info and loads it into the ui.
function loadCooldownGroups(){
    var dbControls = getCurrentBoard();

    // Clear old groups
    $('.board-cooldown-groups').empty();
    
    // Loop through cooldown groups.
    var groups = dbControls.getData('./firebot/cooldownGroups');
    for (item in groups){
        var group = groups[item];
        var groupid = group.groupName;
        var cooldown = group.length;
        var buttons = group.buttons;
        var buttonLength = buttons.length + 1;
        var cooldownGroupTemplate = `
            <div class="cooldown-group tile no-top col-sm-6 col-md-3">
                <div class="cooldown-group-header tile-header">
                    <div class="groupID tileID pull-left">${groupid}</div>
                    <div class="edit-cooldown-group-wrap tile-edit pull-right">
                        <button class="edit-cooldown-group btn btn-default" groupid="${groupid}">
                            <i class="fa fa-pencil" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
                <div class="cooldown-group-body tile-body">
                    <p>Buttons: ${buttonLength}</p>
                    <p>Seconds: ${cooldown}</p>
                </div>
            </div>
        `;

        // Throw onto the page.
        $('.board-cooldown-groups').append(cooldownGroupTemplate);
    }

    // Initialize the edit buttons.
    $( ".edit-cooldown-group" ).click(function() {
        var groupid = $(this).attr('groupid');
        editCooldownGroup(groupid);
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

    try{
        // Get settings for last board.
        var dbControls = getCurrentBoard();
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

// Save cooldown group modal window
$( ".save-cooldown-group" ).click(function() {
    saveCooldownGroup();
});

// Delete current board
$( ".deleteBoard" ).click(function() {
    deleteBoard();
});

// Launch interactive
$( ".interactive-connector" ).click(function() {
    if ( $(this).hasClass('launch-interactive') ){
        // Refresh tokens and kick off auth process.
        refreshToken();
    } else {
        // Let backend know to kill connection.
        ipcRenderer.send('beamInteractive', 'disconnect');
    }
});

////////////////////////
// On App Load Functions
////////////////////////

// Load up last board and organize game list.
menuManager();
loadLastBoard();