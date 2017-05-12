// Edit Button
// This fires when trying to edit a control button.
function editButton(controlId){

    // Clear Settings
    $('#edit-controls-modal input').val('');
    $('#edit-controls-modal .panel').remove();

    // Get last board settings to plug into edit modal.
    var dbSettings = new JsonDB("./app-settings/settings", true, true);
    try{
        // Get last board name.
        var gameName = dbSettings.getData('/interactive/lastBoard');

        // Get settings for last board.
        var dbControls = new JsonDB("./user-settings/controls/"+gameName, true, true);

        // Get settings for this button.
        var button = dbControls.getData('./firebot/controls/'+controlId);

        // Add in info we already have...
        loadSettings(controlId, button);

        // Show modal
        $('#edit-controls-modal').modal('toggle')

        // Initialize Save Button
        $( ".add-new-board-save" ).click(function() {
            saveControls();
        });
    } catch(err){
        console.log('Unable to find control to edit.')
        console.log(err);
    };
}

// Add More Functionality
// This button adds another pane to the settings menu.
function addMoreFunctionality(uniqueid){
    // Collapse other panels.
    $('.collapse').collapse()

    // Build our template.
    var panelTemplate = `
        <div class="panel panel-default panel${uniqueid}" effect="">
            <div class="panel-heading" role="tab" id="heading-${uniqueid}">
                <h4 class="panel-title">
                    <a role="button" data-toggle="collapse" data-parent="#accordion" href="#collapse${uniqueid}" aria-expanded="true" aria-controls="collapse${uniqueid}">
                        Nothing
                    </a>
                    <button class="btn btn-danger pull-right deleteFunctionality" delete="${uniqueid}">X</button>
                </h4>
            </div>
            <div id="collapse${uniqueid}" class="panel-collapse collapse in" role="tabpanel" aria-labelledby="heading${uniqueid}">
                <div class="panel-body">
                    <div class="btn-group">
                        <button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                            <span class="effect-dropdown" uniqueid="${uniqueid}">Pick Effect</span> <span class="caret"></span>
                        </button>
                        <ul class="dropdown-menu effects-menu">
                            <li><a href="#" uniqueid="${uniqueid}" effect="API Button">API Button</a></li>
                            <li><a href="#" uniqueid="${uniqueid}" effect="Change Scene">Change Scene</a></li>
                            <li><a href="#" uniqueid="${uniqueid}" effect="Chat">Chat</a></li>
                            <li><a href="#" uniqueid="${uniqueid}" effect="Cooldown">Cooldown</a></li>
                            <li><a href="#" uniqueid="${uniqueid}" effect="Celebration">Celebration</a></li>
                            <li><a href="#" uniqueid="${uniqueid}" effect="Game Control">Game Control</a></li>
                            <li><a href="#" uniqueid="${uniqueid}" effect="Play Sound">Play Sound</a></li>
                            <li><a href="#" uniqueid="${uniqueid}" effect="Show Image">Show Image</a></li>
                        </ul>
                    </div>
                    <div class="effect-settings-panel">
                        <div class="effect-specific-title"><h4>Please select an effect.</h4></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Throw completed template onto page.
    $('.functionality-settings .panel-group').append(panelTemplate);

    // Re-initialize the accordion.
    $('.functionality-settings #accordion').collapse()

    // Initialize Delete Buttons
    $( ".deleteFunctionality" ).click(function() {
        var uniqueid = $(this).attr('delete');
        deleteFunctionality(uniqueid);
    });

    // Initialize Effect Dropdown
    $( ".effects-menu a" ).click(function() {
        var uniqueid = $(this).attr('uniqueid');
        var effect = $(this).attr('effect');
        functionalitySwitcher(uniqueid, effect);
    });
}

// Functionality Switcher
// This swaps out all of the settings in a panel when the type is changed.
function functionalitySwitcher(uniqueid, effect){
    $('.effect-dropdown[uniqueid="'+uniqueid+'"], .panel'+uniqueid+' .panel-title a').text(effect);
    $('.panel'+uniqueid).attr("effect", effect);

    // Clear panel.
    $('.panel'+uniqueid+' .effect-settings-panel').empty();

    switch(effect) {
    case "API Button":
        var effectTemplate = apiButtonSettings(uniqueid);
        break;
    case "Change Scene":
        var effectTemplate = changeSceneSettings(uniqueid);
        break;
    case "Chat":
        var effectTemplate = chatSettings(uniqueid);
        break;
    case "Cooldown":
        var effectTemplate = cooldownSettings(uniqueid);
        break;
    case "Celebration":
        var effectTemplate = celebrationSettings(uniqueid);
        break;
    case "Game Control":
        var effectTemplate = gameControlSettings(uniqueid);
        break;
    case "Play Sound":
        var effectTemplate = playSoundSettings(uniqueid);
        break;
    case "Show Image":
        var effectTemplate = showImageSettings(uniqueid);
        break;
    }

}

// API Button Settings
// Loads up the settings for the api effect type.
function apiButtonSettings(uniqueid){

    var effectTemplate = `
        <div class="effect-specific-title"><h4>Which API should I use?</h4></div>
        <div class="btn-group">
        <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            <span class="api-effect-type">Pick One</span> <span class="caret"></span>
        </button>
        <ul class="dropdown-menu api-effect-dropdown">
            <li><a href="#">Advice</a></li>
            <li><a href="#">Cat Picture</a></li>
            <li><a href="#">Cat Fact</a></li>
            <li><a href="#">Dog Picture</a></li>
            <li><a href="#">Dog Fact</a></li>
            <li><a href="#">Aww</a></li>
            <li><a href="#">Pokemon</a></li>
            <li><a href="#">Number Trivia</a></li>
        </ul>
        </div>
    `;

    // Put onto the page.
    $('.panel'+uniqueid+' .effect-settings-panel').append(effectTemplate); 

    // When an effect is clicked, change the dropdown title.
    $( ".panel"+uniqueid+" .api-effect-dropdown a" ).click(function() {
        var text = $(this).text();
        $(".panel"+uniqueid+" .api-effect-type").text(text);
    });
}

// Change Scene Settings
// Loads up the settings for the change scene effect type.
function changeSceneSettings(uniqueid){
    var effectTemplate = `
        <div class="effect-specific-title"><h4>Which scene should I switch to?</h4></div>
        <div class="btn-group">
        <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            <span class="change-scene-effect-type">Pick One</span> <span class="caret"></span>
        </button>
        <ul class="dropdown-menu change-scene-effect-dropdown">
        </ul>
        </div>
    `;

    // Put onto the page.
    $('.panel'+uniqueid+' .effect-settings-panel').append(effectTemplate); 

    // Pull in all scenes for selected board.
    try{

        // Get settings for last board.
        var dbControls = getCurrentBoard();

        // Get settings for this button.
        var scenes = dbControls.getData('./beam');

        // Loop through scenes and get names.
        for (scene of scenes){
            var name = scene.sceneID;
            var dropdowntemplate = `<li><a href="#">${name}</a></li>`
            $(".panel"+uniqueid+" .change-scene-effect-dropdown").append(dropdowntemplate);
        }
    } catch(err){};

    // When an effect is clicked, change the dropdown title.
    $(".panel"+uniqueid+" .change-scene-effect-dropdown a" ).click(function() {
        var text = $(this).text();
        $(".panel"+uniqueid+" .change-scene-effect-type").text(text);
    });
}

// Chat Settings
// Loads up settings for the chat effect type.
function chatSettings(uniqueid){
    var effectTemplate = `
        <div class="effect-specific-title"><h4>Who should I chat as?</h4></div>
        <div class="btn-group">
            <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <span class="chat-effect-type">Pick One</span> <span class="caret"></span>
            </button>
            <ul class="dropdown-menu chat-effect-dropdown">
                <li><a href="#">Streamer</a></li>
                <li><a href="#">Bot</a></li>
            </ul>
        </div>
        <div class="effect-specific-title"><h4>What should I say?</h4></div>
        <div class="input-group">
            <span class="input-group-addon" id="chat-text-effect-type">Message</span>
            <input type="text" class="form-control" id="chat-text-setting" aria-describedby="chat-text-effect-type">
        </div>
    `;

    // Put onto the page.
    $('.panel'+uniqueid+' .effect-settings-panel').append(effectTemplate); 

    // When an effect is clicked, change the dropdown title.
    $( ".panel"+uniqueid+" .chat-effect-dropdown a" ).click(function() {
        var text = $(this).text();
        $(".panel"+uniqueid+" .chat-effect-type").text(text);
    });
}

// Cooldown Button Settings
// Loads up the settings for the cooldown effect type.
function cooldownSettings(uniqueid){
    var effectTemplate = `
        <div class="effect-specific-title"><h4>Which buttons should I put on cooldown?</h4></div>
        <div class="btn-group">
            <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <span class="cooldown-button-effect-type">Pick One</span> <span class="caret"></span>
            </button>
            <ul class="dropdown-menu cooldown-button-effect-dropdown">
                <li><a href="#">All</a></li>
            </ul>
        </div>
        <div class="selected-cooldown-buttons">
        </div>

        <div class="effect-specific-title"><h4>How long should these cooldown for?</h4></div>
        <div class="input-group">
            <span class="input-group-addon" id="cooldown-amount-effect-type">Seconds</span>
            <input type="text" class="form-control" id="cooldown-amount-setting" aria-describedby="cooldown-amount-effect-type">
        </div>
    `;

    // Put onto the page.
    $('.panel'+uniqueid+' .effect-settings-panel').append(effectTemplate);

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
                $(".panel"+uniqueid+" .cooldown-button-effect-dropdown").append(dropdowntemplate);
            }
        }
    } catch(err){};

    // Add in a new button when one is selected.
    $( ".cooldown-button-effect-dropdown a" ).click(function() {
        var text = $(this).text();
        var template = `<div class="selected-cooldown-button pill cooldown-`+uniqueid+`">
                            <p class="content"><span>${text}</span></p>
                            <div class="remove-cooldown pull-right">
                                <button class="btn btn-danger">X</button>
                            </div>
                        </div>`;
        $(".panel"+uniqueid+" .selected-cooldown-buttons").append(template);

        // When X is clicked, remove button from list.
        $(".panel"+uniqueid+" .remove-cooldown button").click(function(){
            $(this).closest(".panel"+uniqueid+" .selected-cooldown-button").remove();
        });
    });
}

// Celebration Button Settings
// Loads up the settings for the celebration effect type.
function celebrationSettings(uniqueid){
    var effectTemplate = `
        <div class="effect-specific-title"><h4>How should we celebrate?</h4></div>
        <div class="btn-group">
        <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            <span class="celebrate-effect-type">Pick One</span> <span class="caret"></span>
        </button>
        <ul class="dropdown-menu celebrate-effect-dropdown">
            <li><a href="#">Fireworks</a></li>
        </ul>
        </div>

        <div class="effect-specific-title"><h4>How many seconds should the party last?</h4></div>
        <div class="input-group">
            <span class="input-group-addon" id="celebration-length-effect-type">Seconds</span>
            <input type="text" class="form-control" id="celebration-amount-setting" aria-describedby="celebration-length-effect-type">
        </div>
    `;

    // Put onto the page.
    $('.panel'+uniqueid+' .effect-settings-panel').append(effectTemplate);

    // When an effect is clicked, change the dropdown title.
    $( ".panel"+uniqueid+" .celebrate-effect-dropdown a" ).click(function() {
        var text = $(this).text();
        $(".panel"+uniqueid+" .celebrate-effect-type").text(text);
    });
}

// Game Control Button Settings
// Loads up the settings for the game control effect type.
function gameControlSettings(uniqueid){
    var effectTemplate = `
        <div class="effect-specific-title"><h4>Which button should I press?</h4></div>
        <div class="input-group">
            <span class="input-group-addon" id="button-press-effect-type">Press</span>
            <input type="text" class="form-control" id="game-control-press-setting" aria-describedby="button-press-effect-type">
        </div>

        <div class="effect-specific-title"><h4>Does this button have an opposite button?</h4></div>
        <div class="input-group">
            <span class="input-group-addon" id="opposite-button-effect-type">Opposite</span>
            <input type="text" class="form-control" id="game-control-opposite-setting" aria-describedby="opposite-button-effect-type">
        </div>
    `;

    // Put onto the page.
    $('.panel'+uniqueid+' .effect-settings-panel').append(effectTemplate);
}

// Play Sound Settings
// Loads up the settings for the play sound effect type.
function playSoundSettings(uniqueid){
    var effectTemplate = `
        <div class="effect-specific-title"><h4>What sound should I play?</h4></div>
        <div class="input-group">
            <span class="input-group-btn">
            <button class="btn btn-default play-sound-effect-chooser" type="button">Choose</button>
            </span>
            <input type="text" class="form-control play-sound-effect-input">
        </div><!-- /input-group -->

        <div class="effect-specific-title"><h4>How loud should it be?</h4></div>
        <div class="input-group">
            <span class="input-group-addon" id="volume-effect-type">1-10</span>
            <input type="text" class="form-control" id="sound-volume-setting" aria-describedby="volume-effect-type">
        </div>
    `;

    // Put onto the page.
    $('.panel'+uniqueid+' .effect-settings-panel').append(effectTemplate);

    // Audio File Selector
    // This monitors the audio file select box and when it is clicked sends request to main process to open dialog.
    $(".panel"+uniqueid+" .play-sound-effect-chooser" ).click(function() {
        ipcRenderer.send('getSoundPath', uniqueid);
    });

}

// Show Image Settings
// Loads up the settings for the show image effect type.
function showImageSettings(uniqueid){
    var effectTemplate = `
        <div class="effect-specific-title"><h4>Which image should I show?</h4></div>
        <div class="input-group">
            <span class="input-group-btn">
            <button class="btn btn-default show-image-effect-chooser" type="button">Choose</button>
            </span>
            <input type="text" class="form-control show-image-effect-input">
        </div><!-- /input-group -->

        <div class="effect-specific-title"><h4>What location should it show in?</h4></div>
        <div class="btn-group">
        <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            <span class="image-placement-effect-type">Pick One</span> <span class="caret"></span>
        </button>
        <ul class="dropdown-menu image-placement-effect-dropdown">
            <li><a href="#">Top Left</a></li>
            <li><a href="#">Top Middle</a></li>
            <li><a href="#">Top Right</a></li>
            <li><a href="#">Middle Left</a></li>
            <li><a href="#">Middle</a></li>
            <li><a href="#">Middle Right</a></li>
            <li><a href="#">Bottom Left</a></li>
            <li><a href="#">Bottom Middle</a></li>
            <li><a href="#">Bottom Right</a></li>
        </ul>
        </div>

        <div class="effect-specific-title"><h4>How long should it show?</h4></div>
        <div class="input-group">
            <span class="input-group-addon" id="image-length-effect-type">Seconds</span>
            <input type="text" class="form-control" id="image-length-setting" aria-describedby="image-length-effect-type">
        </div>
    `;

    // Put onto the page.
    $('.panel'+uniqueid+' .effect-settings-panel').append(effectTemplate);

    // When an effect is clicked, change the dropdown title.
    $( ".panel"+uniqueid+" .image-placement-effect-dropdown a" ).click(function() {
        var text = $(this).text();
        $(".panel"+uniqueid+" .image-placement-effect-type").text(text);
    });

    // Image File Selector
    // This monitors the audio file select box and when it is clicked sends request to main process to open dialog.
    $(".panel"+uniqueid+" .show-image-effect-chooser" ).click(function() {
        ipcRenderer.send('getImagePath', uniqueid);
    });
}

// Delete Functionality
// This button deletes functionality on the button settings page.
function deleteFunctionality(uniqueid){
    $('.panel'+uniqueid).remove();
}


//////////////
// SAVING
/////////////

// Save Controls
// This runs when the save button is clicked in the controls editor modal.
function saveControls(){

    // Get the current board.
    var dbControls = getCurrentBoard();

    // General Settings
    var controlID = $('.settings-controlid input').val();
    var buttontext = $('.settings-buttontext input').val();
    var sparkcost = $('.settings-sparkcost input').val();

    // TO DO: Push new values to beam.

    // Clear all previously saved effects.
    dbControls.delete('./firebot/controls/'+controlID+'/effects');

    // Effect Settings
    // Loop through each effect.
    var i = 1;
    $( ".functionality-settings .panel-group .panel" ).each(function( index ) {
        var effect = $(this).attr('effect');
        switch(effect) {
        case "API Button":
            var apiType = $(this).find('.api-effect-type').text();
            dbControls.push('./firebot/controls/'+controlID+'/effects/'+i, {"type": "API Button", "api": apiType});
            break;
        case "Change Scene":
            var sceneChange = $(this).find('.change-scene-effect-type').text();
            dbControls.push('./firebot/controls/'+controlID+'/effects/'+i, {"type": "Change Scene", "scene": sceneChange});
            break;
        case "Chat":
            var chatter = $(this).find('.chat-effect-type').text();
            var message = $(this).find('#chat-text-setting').val();
            dbControls.push('./firebot/controls/'+controlID+'/effects/'+i, {"type": "Chat", "chatter": chatter, "message": message});
            break;
        case "Cooldown":
            // Cycle through selected buttons and push to array.
            var cooldownButtons = [];
            $( ".selected-cooldown-buttons" ).find('.selected-cooldown-button').each(function( index ) {
                var text = $(this).find('span').text();
                cooldownButtons.push(text);
            });
            var cooldownLength = $(this).find('#cooldown-amount-setting').val();
            dbControls.push('./firebot/controls/'+controlID+'/effects/'+i, {"type": "Cooldown", "buttons": cooldownButtons, "length": cooldownLength});
            break;
        case "Celebration":
            var celebration = $(this).find('.celebrate-effect-type').text();
            var celebrationLength = $(this).find('#celebration-amount-setting').val();
            dbControls.push('./firebot/controls/'+controlID+'/effects/'+i, {"type": "Celebration", "celebration": celebration, "length": celebrationLength});
            break;
        case "Game Control":
            var buttonPress = $(this).find('#game-control-press-setting').val();
            var oppositeButton = $(this).find('#game-control-opposite-setting').val();
            dbControls.push('./firebot/controls/'+controlID+'/effects/'+i, {"type": "Game Control", "press": buttonPress, "opposite": oppositeButton});
            break;
        case "Play Sound":
            var soundFile = $(this).find('.play-sound-effect-input').val();
            var soundVolume = $(this).find('#sound-volume-setting').val();
            dbControls.push('./firebot/controls/'+controlID+'/effects/'+i, {"type": "Play Sound", "file": soundFile, "volume": soundVolume});
            break;
        case "Show Image":
            var imageFile = $(this).find('.show-image-effect-input').val();
            var imagePlacement = $(this).find('.image-placement-effect-type').text();
            var imageLength = $(this).find('#image-length-setting').val();
            dbControls.push('./firebot/controls/'+controlID+'/effects/'+i, {"type": "Show Image", "file": imageFile, "position": imagePlacement, "length": imageLength});
            break;
        }
        i++
    });
}

//////////////
// Loading
/////////////

// Load Settings
// This function kickstarts the process of loading already saved settings on edit.
function loadSettings(controlId, button){
    var effects = button.effects;

    // Load up general settings
    $('.edit-title-controlid').text(controlId);
    $('.settings-controlid input').val(controlId);
    $('.settings-buttontext input').val(button.text);
    $('.settings-sparkcost input').val(button.cost);

    // Start on the effects.
    if (effects !== undefined){
        for (var i = 1; i < Object.keys(effects).length +1; i++) { 
            var effect = effects[''+i+''];
            var effectType = effect.type; 

            // Create panels
            var uniqueid = getUniqueId();
            addMoreFunctionality(uniqueid);
            functionalitySwitcher(uniqueid, effectType);

            // Now it's time to load up the settings for each.
            switch(effectType) {
            case "API Button":
                $('.panel'+uniqueid+' .api-effect-type').text(effect.api);
                break;
            case "Change Scene":
                $('.panel'+uniqueid+' .change-scene-effect-type').text(effect.scene);
                break;
            case "Chat":
                $('.panel'+uniqueid+' .chat-effect-type').text(effect.chatter);
                $('.panel'+uniqueid+' #chat-text-setting').val(effect.message);
                break;
            case "Cooldown":
                // Cycle through selected buttons and push to array.
                var cooldownButtons = effect.buttons;
                for (button of cooldownButtons){
                    var text = button;
                    var template = `<div class="selected-cooldown-button pill cooldown-`+uniqueid+`">
                                        <p class="content"><span>${text}</span></p>
                                        <div class="remove-cooldown pull-right">
                                            <button class="btn btn-danger">X</button>
                                        </div>
                                    </div>`;
                    $(".panel"+uniqueid+" .selected-cooldown-buttons").append(template);

                    // When X is clicked, remove button from list.
                    $(".panel"+uniqueid+" .remove-cooldown button").click(function(){
                        $(this).closest(".panel"+uniqueid+" .selected-cooldown-button").remove();
                    });
                }
                $('.panel'+uniqueid+' #cooldown-amount-setting').val(effect.length);
                break;
            case "Celebration":
                $('.panel'+uniqueid+' .celebrate-effect-type').text(effect.celebration);
                $('.panel'+uniqueid+' #celebration-amount-setting').val(effect.length);
                break;
            case "Game Control":
                $('.panel'+uniqueid+' #game-control-press-setting').val(effect.press);
                $('.panel'+uniqueid+' #game-control-opposite-setting').val(effect.opposite);
                break;
            case "Play Sound":
                $('.panel'+uniqueid+' .play-sound-effect-input').val(effect.file);
                $('.panel'+uniqueid+' #sound-volume-setting').val(effect.volume);
                break;
            case "Show Image":
                $('.panel'+uniqueid+' .show-image-effect-input').val(effect.file);
                $('.panel'+uniqueid+' .image-placement-effect-type').text(effect.position);
                $('.panel'+uniqueid+' #image-length-setting').val(effect.length);
                break;
            }
        }
    }
}

// Got Sound File Path
// Recieves event from main process that a sound file path has been recieved.
ipcRenderer.on('gotSoundFilePath', function (event, data){
    var uniqueid = data.id;
    $('.panel'+uniqueid+' .play-sound-effect-input').val(data.path[0]);
});

// Got Image File Path
// Recieves event from main process that an image file path has been recieved.
ipcRenderer.on('gotImageFilePath', function (event, data){
    var uniqueid = data.id;
    $('.panel'+uniqueid+' .show-image-effect-input').val(data.path[0]);
});

//////////////////////
// On Click Functions
/////////////////////

// Button that adds more functionality in settings area.
$( ".add-more-functionality button" ).click(function() {
    var uniqueid = getUniqueId();
    addMoreFunctionality(uniqueid);
});