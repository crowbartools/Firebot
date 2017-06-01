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

    // Hit up mixer for the latest json.
    $.getJSON( "https://mixer.com/api/v1/interactive/versions/"+versionid, function( data ) {
        if(data.game === null){
            errorLog("This board seems to have been deleted from Mixer. If you are sure you want to remove all the settings. Go to your Firebot folder /user-settings/controls and delete the control file.");
        } else {
            var gameName = data.game.name;
            var gameJson = data.controls.scenes;

            // Push to Json
            backendBuilder(gameName, gameJson, versionid);

            // Add to board menu.
            menuManager();
        }

    })
}

// Backend Controls Builder
// This takes the mixer json and builds out the structure for the controls file.
function backendBuilder(gameNameId, gameJsonInfo, versionIdInfo){
    const gameName = gameNameId;
    const gameJson = gameJsonInfo;
    const versionid = versionIdInfo

    var dbControls = getCurrentBoard();

    // Push mixer Json to controls file.
    dbControls.push('/versionid', parseInt(versionid) );
    dbControls.push('/mixer', gameJson);

    // Cleanup Firebot Controls
    backendCleanup(dbControls)
    .then((res) => {
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
                            var text= "None";
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
                    dbControls.push('./firebot/scenes/'+scenename+'/default', ["None"]);
                }
            }
        }

        // Next step, setup the ui using the controls file.
        sceneBuilder(gameName);
    })
}

// Backend Cleanup
// This takes the mixer json and compares it against the Firebot json to remove any items no longer needed.
function backendCleanup(dbControls){
    return new Promise((resolve, reject) => {

        // Check if Firebot settings exist
        try{

            // We have saved settings. Time to clean up!
            var mixerSettings = dbControls.getData('./mixer');
            var firebotSettings = dbControls.getData('./firebot');


            // Make an array containing all of the buttons and scenes from each json so we can compare.
            var mixerButtonArray = [];
            var firebotButtonArray = [];
            var mixerSceneArray = [];
            var firebotSceneArray = [];

            // Add mixer stuff to mixer arrays for comparison.
            for(scene of mixerSettings){
                // Save Scenes
                var sceneID = scene.sceneID;
                mixerSceneArray.push(sceneID);

                // Save Buttons
                var controls = scene.controls;
                for (control of controls){
                    var controlID = control.controlID;
                    mixerButtonArray.push(controlID);
                }
            }

            // Add Firebot scenes to firebot array.
            for (scene in firebotSettings.scenes){
                firebotSceneArray.push(scene);
            }

            // Add Firebot buttons to firebot array for comparison.
            for(control in firebotSettings.controls){
                firebotButtonArray.push(control);
            }

            // Filter out all buttons that match. Anything left in the firebotButtonArray no longer exists on the mixer board.
            firebotButtonArray = firebotButtonArray.filter(val => !mixerButtonArray.includes(val));

            // Filter out all scenes that match. Anything left in the firebotScenenArray no longer exists on the mixer board.
            firebotSceneArray = firebotSceneArray.filter(val => !mixerSceneArray.includes(val));

            // Remove buttons that are no longer needed.
            // If a scene was deleted from Mixer, the buttons for that scene should be gone as well.
            for (button of firebotButtonArray){
                try{
                    dbControls.delete('./firebot/controls/'+button);
                    console.log('Button '+button+' is not on the mixer board. Deleting.');

                    // Go through cooldown groups and remove the button if it is listed there.
                    for(cooldown in firebotSettings.cooldownGroups){
                        var cooldownButtons = dbControls.getData('./firebot/cooldownGroups/'+cooldown+'/buttons');
                        var i = cooldownButtons.length
                        while (i--) {
                            if (cooldownButtons[i] == button) {
                                cooldownButtons.splice(i,1);
                                console.log('Removing '+button+' from cooldown group '+cooldown+'.');
                                break;
                            }
                        }

                        // Push corrected cooldown array to db.
                        dbControls.push('./firebot/cooldownGroups/'+cooldown+'/buttons', cooldownButtons);
                    }
                }catch(err){
                    console.log(err);
                }   
            }

            // Remove scenes that are no longer needed.
            for (scene of firebotSceneArray){
                try{
                    dbControls.delete('./firebot/scenes/'+scene)
                    console.log('Scene '+scene+' is not on the mixer board. Deleting.');
                }catch(err){
                    console.log(err);
                }
            }

            resolve(true);
        }catch(err){
            // We don't have any saved settings yet. Resolve this and don't cleanup anything.
            console.log(err);
            resolve(true);
        }
    })
}

// UI Controls Builder
// This takes info and builds out scenes.
function sceneBuilder(gameName){
    var dbControls = new JsonDB("./user-settings/controls/"+gameName, true, true);
    var scenes = dbControls.getData('/mixer');

    // Template for tabs.
    var boardTemplate = `
    <ul class="nav nav-tabs interactive-tab-nav" role="tablist">
        <li role="presentation" class="active"><a href="#board-settings" aria-controls="board-settings" role="tab" data-toggle="tab">Settings</a></li>
    </ul>
    <div class="tab-content">
        <div role="tabpanel" class="tab-pane active" id="board-settings">
            <div class="general-board-settings">
                <h3>Group Settings</h3>
                <div class="board-group-defaults">
                    <p>All of your scenes are listed below. Here you can select which groups you want to use and which scenes they will use as their starting point. Groups are only "active" if selected here, otherwise they will not be used.</p>
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
    $('.board-title a').attr('href', 'https://mixer.com/i/studio').text(gameName);

    // Set as last used board.
    var dbSettings = new JsonDB("./user-settings/settings", true, true);
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
// This puts all scenes into the general board settings.
function boardGroupSettings(scenes){
    var dbControls = getCurrentBoard();

    // Loop through scenes
    for (scene of scenes){
        var uniqueid = getUniqueId();
        var sceneName = scene.sceneID;

        var groupSettingTemplate = `
            <div class="board-group board-group${uniqueid} tile no-top col-sm-6 col-md-3">
                <div class="tile-header">
                    <div class="board-groupscene tileID pull-left">${sceneName}</div>
                    <div class="edit-groupscene tile-edit pull-right">
                        <button class="edit-groupscene-btn btn btn-default" sceneunique="${uniqueid}">
                            <i class="fa fa-pencil" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
                <div class="board-group-scene-body tile-body"></div>
            </div>
        `;

        // Throw it onto the page.
        $('.board-group-defaults-settings').append(groupSettingTemplate);

        // Load up already saved settings.
        try{
            // Loop through saved groups and load them into ui for this scene.
            var sceneSettings = dbControls.getData('/firebot/scenes/'+sceneName+'/default');
            for (group of sceneSettings){
                $('.board-group'+uniqueid+' .board-group-scene-body').append('<div class="board-groupscene-group">'+group+'</div>');
            }

            // Always put "Default" as a group for the "default" scene
            if(sceneName == "default"){
                $('.board-group'+uniqueid+' .board-group-scene-body').prepend('<div class="board-groupscene-group">Default</div>');
            }
        }catch(err){console.log(err)}

        // Edit Scenegroup
        $( ".board-group"+uniqueid+" .edit-groupscene-btn" ).click(function() {
            // Get the controlId and pass it off to the edit function.
            var sceneunique = $(this).attr('sceneunique');
            editGroupScene(sceneunique); // This function is in controls-editor.js.
        });
    }
}

// Edit Groupscene
// This opens up and manages the modal for editing scene group defaults for a board.
function editGroupScene(uniqueid){
     var dbControls = getCurrentBoard();
     var sceneName = $('.board-group'+uniqueid+' .tileID').text();

     // Set unique id for easy editing.
     $('.edit-scenegroup-defaults').attr('uniqueid', uniqueid);

    // Clear 
    $('.custom-scenegroup').remove();
    $('.scenegroup-option input').prop('checked', false);

    // Load up all custom made groups in each dropdown.
    var dbGroup = new JsonDB("./user-settings/groups", true, true);
    try{
        var groups = dbGroup.getData('/');
        for (var group in groups){

            // Ignore the "banned" group when placing selectable options.
            if(group !== "banned"){
                var template = `
                    <div class="scenegroup-option custom-scenegroup">
                        <input type="checkbox" group="${group}" aria-label="..."> <span>${group}</span>
                    </div>
                `;
                $('.edit-scenegroup-defaults').append(template);
            }
        }

        // If this scene is the default one put in an perma checked default group label.
        // Then remove the "None" option.
        if(sceneName == "default"){
            var template = `
                <div class="scenegroup-option custom-scenegroup">
                    <input type="checkbox" group="default" aria-label="..." checked disabled> <span>Default</span>
                </div>
            `;
            $('.edit-scenegroup-defaults').prepend(template);

            // Remove none
            $('.edit-scenegroup-defaults[uniqueid="'+uniqueid+'"').find('.scenegroup-option input[group="None"]').parent().remove();
        }
    }catch(err){console.log(err)};

    // Load up any existing settings
    try{
        var sceneSettings = dbControls.getData('/firebot/scenes/'+sceneName+'/default');
        for (group of sceneSettings){
            $('.edit-scenegroup-defaults[uniqueid="'+uniqueid+'"').find('.scenegroup-option input[group = '+group+']').prop('checked', true);
        }
    }catch(err){}
    
    // Save Scenegroup
    $( ".edit-scenegroup-save" ).off().click(function() {
        var saveArray = [];

        // For each option in the edit modal check to see if it's checked or not.
        $('.scenegroup-option input').each(function(){
            if( $(this).prop('checked') === true ){
                if($(this).attr('group') !== "default"){
                    saveArray.push( $(this).attr('group') );
                }
                
                // Push to db
                dbControls.push('/firebot/scenes/'+sceneName+'/default', saveArray);

                // Load up new settings
                try{
                    // Loop through saved groups and load into the ui.
                    $('.board-group'+uniqueid+' .board-group-scene-body').empty();
                    for (group of saveArray){
                        $('.board-group'+uniqueid+' .board-group-scene-body').append('<div class="board-groupscene-group">'+group+'</div>');
                    }

                    // Always put "Default" as a group for the "default" scene
                    if(sceneName == "default"){
                        $('.board-group'+uniqueid+' .board-group-scene-body').prepend('<div class="board-groupscene-group">Default</div>');
                    };
                }catch(err){console.log(err)}

            }
        });
    });

    // Show modal
    $('#edit-scenegroup-modal').modal('toggle');
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
                            <div class="playbuttonwrap"><button class="playbutton" control="${controlID}"><i class="fa fa-play-circle" aria-hidden="true"></i></button></div>
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

    // Initialize button play
    $( ".playbutton" ).click(function() {
        var button = $(this);
        fireButton( button.attr('control') );
        button.find('i').removeClass('fa-play-circle').addClass('fa-spinner fa-pulse');
        setTimeout(function(){
            playFinished(button);
        }, 2000);
    });
}

// Play Finished
// This returns the play button back to normal after it becomes a spinner;
function playFinished(button){
    button.find('i').removeClass('fa-spinner fa-pulse').addClass('fa-play-circle');
}

// Add Cooldown Group
// This controls the actions on the cooldown group module.
function addCooldownGroup(){
    // Change title of modal
    $('#newCooldownGroupLabel').text('Add New Cooldown Group');

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
        var scenes = dbControls.getData('./mixer');

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
                            <p class="content"><span>${text}</span></p>
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

    // Hide delete button;
    $('.remove-cooldown-group').hide();
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
    $('#newCooldownGroupLabel').text('Edit Cooldown Group');
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

        // Intialize delete button.
        $(".remove-cooldown-group-button button").click(function(){
            $(this).closest(".selected-cooldown-group-button").remove();
        });
    }

    // Pull in all buttons for selected board.
    try{
        // Get settings for last board.
        var dbControls = getCurrentBoard();

        // Get settings for this button.
        var scenes = dbControls.getData('./mixer');

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
                            <p class="content"><span>${text}</span></p>
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

    // We're editing, so show the delete button.
    $('.remove-cooldown-group').show();
    $(".remove-cooldown-group").click(function(){
        var sceneid = $('.cooldown-groupid').val();
        try{
            // Delete and reload groups.
            dbControls.delete('./firebot/cooldownGroups/'+sceneid);
            loadCooldownGroups();
        }catch(err){
            errorLog("Error deleting this cooldown group.")
        }
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
    try{
        var groups = dbControls.getData('./firebot/cooldownGroups');
        for (item in groups){
            var group = groups[item];
            var groupid = group.groupName;
            var cooldown = group.length;
            var buttons = group.buttons;
            var buttonLength = buttons.length;
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
    }catch(err){
        console.log('No cooldown groups to load.');
    }
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

            // Pull new json from mixer.
            boardBuilder(versionid);        
        } catch(err){
            errorLog("Unable to load this board. Try restarting the app.")
        };
    });
}

// Last Board Loader
// This loads up the last board that was selected.
function loadLastBoard(){

    try{
        // Get settings for last board.
        var dbControls = getCurrentBoard();
        var versionid = dbControls.getData('/versionid');

        // Pull new json from mixer.
        boardBuilder(versionid);        
    } catch(err){};
}

// Delete Board
// This deletes the currently selected board on confirmation.
function deleteBoard(){
    var dbSettings = new JsonDB("./user-settings/settings", true, true);

    // Check for last board and load ui if one exists.
    try{
        var gameName = dbSettings.getData('/interactive/lastBoard');
        var filepath = './user-settings/controls/'+gameName+'.json';

        // Remove last board
        dbSettings.delete('/interactive/lastBoard')

        fs.exists(filepath, function(exists) {
            if(exists) {
                    // File exists deleting
                    fs.unlink(filepath,function(err){
                        clearBoard();
                    });
            } else {
                renderWindow.webContents.send('error', "Well this is weird. The board you tried to delete is already gone. Try restarting the app.");
                console.log("This file doesn't exist, cannot delete");
            }
        });
    } catch(err){};
}

// Fire Button
// This function will active a button when clicked.
function fireButton(controlID){
    ipcRenderer.send('manualButton', controlID);
}

// Board Clear
// This clears all of the information out of the UI for the current board.
function clearBoard(){
    menuManager();
    $('.board-title a').text('');
    $('.interactive-board-container').empty();
}

// Connection Sounds
function connectSound(type){
    if(type == "Online"){
        var sound = new Howl({
            src: ["./sounds/online.mp3"],
            volume: 0.4
        });
    } else {
        var sound = new Howl({
            src: ["./sounds/offline.mp3"],
            volume: 0.4
        });
    }
    // Play sound
    sound.play();
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
        $(this).removeClass('launch-interactive');

        // Refresh tokens and kick off auth process.
        refreshToken();
    } else {
        $(this).addClass('launch-interactive');

        // Let backend know to kill connection.
        ipcRenderer.send('mixerInteractive', 'disconnect');
    }
});

// Connection Monitor
// Recieves event from main process that connection has been established or disconnected.
ipcRenderer.on('connection', function (event, data){
    if(data == "Online"){
        $('.connection-indicator').addClass('online');
        $('.connection-text').text('Connected - Click to Disconnect');

        // See if we should play a sound or not.
        try{
            var dbSettings = new JsonDB("./user-settings/settings", true, true);
            var soundSetting = dbSettings.getData('./settings/sounds');
            if(soundSetting == "On"){
                connectSound("Online");
            }
        } catch(err){}
        
    } else {
        $('.connection-indicator').removeClass('online');
        $('.connection-text').text('Disconnected - Click to Launch Board');

        // See if we should play a sound or not.
        try{
            var dbSettings = new JsonDB("./user-settings/settings", true, true);
            var soundSetting = dbSettings.getData('./settings/sounds');
            if(soundSetting == "On"){
                connectSound("Offline");
            }
        } catch(err){}
    }
})

////////////////////////
// On App Load Functions
////////////////////////

// Load up last board and organize game list.
menuManager();
loadLastBoard();