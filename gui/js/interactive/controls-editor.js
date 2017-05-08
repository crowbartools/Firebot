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
        $('.edit-title-controlid').text(controlId);
        $('.settings-controlid input').val(controlId);
        $('.settings-buttontext input').val(button.text);
        $('.settings-sparkcost input').val(button.cost)

        // Show modal
        $('#edit-controls-modal').modal('toggle')
    } catch(err){
        console.log('Unable to find control to edit.')
    };
}

// Add More Functionality
// This button adds another pane to the settings menu.
function addMoreFunctionality(){
    var uniqueid = new Date().getTime().toString();

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

    // Clear panel.
    $('.panel'+uniqueid+' .effect-settings-panel').empty();

    switch(effect) {
    case "API Button":
        var effectTemplate = apiButtonSettings();
        break;
    case "Change Scene":
        var effectTemplate = changeSceneSettings();
        break;
    case "Cooldown":
        var effectTemplate = cooldownSettings();
        break;
    case "Celebration":
        var effectTemplate = celebrationSettings();
        break;
    case "Game Control":
        var effectTemplate = gameControlSettings();
        break;
    case "Play Sound":
        var effectTemplate = playSoundSettings();
        break;
    case "Show Image":
        var effectTemplate = showImageSettings();
        break;
    }

    $('.panel'+uniqueid+' .effect-settings-panel').append(effectTemplate); 
}

// API Button Settings
// Loads up the settings for the api effect type.
function apiButtonSettings(){

    var effectTemplate = `
        <div class="effect-specific-title"><h4>Which API should I use?</h4></div>
        <div class="btn-group">
        <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            <span class="api-effect-type">Pick One</span> <span class="caret"></span>
        </button>
        <ul class="dropdown-menu">
            <li><a href="#">Action</a></li>
            <li><a href="#">Another action</a></li>
            <li><a href="#">Something else here</a></li>
        </ul>
        </div>
    `;

    return effectTemplate;
}

// Change Scene Settings
// Loads up the settings for the change scene effect type.
function changeSceneSettings(){
    var effectTemplate = `
        <div class="effect-specific-title"><h4>Which scene should I switch to?</h4></div>
        <div class="btn-group">
        <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            <span class="api-effect-type">Pick One</span> <span class="caret"></span>
        </button>
        <ul class="dropdown-menu">
            <li><a href="#">Action</a></li>
            <li><a href="#">Another action</a></li>
            <li><a href="#">Something else here</a></li>
        </ul>
        </div>
    `;
    return effectTemplate;
}

// Cooldown Button Settings
// Loads up the settings for the cooldown effect type.
function cooldownSettings(){
    var effectTemplate = `
        <div class="effect-specific-title"><h4>Which buttons should I put on cooldown?</h4></div>

        <div class="effect-specific-title"><h4>How long should these cooldown for?</h4></div>
    `;
    return effectTemplate;
}

// Celebration Button Settings
// Loads up the settings for the celebration effect type.
function celebrationSettings(){
    var effectTemplate = `
        <div class="effect-specific-title"><h4>How should we celebrate?</h4></div>

        <div class="effect-specific-title"><h4>How many seconds should the party last?</h4></div>
    `;
    return effectTemplate;
}

// Game Control Button Settings
// Loads up the settings for the game control effect type.
function gameControlSettings(){
    var effectTemplate = `
        <div class="effect-specific-title"><h4>Which button should I press?</h4></div>

        <div class="effect-specific-title"><h4>Does this button have an opposite button?</h4></div>
    `;
    return effectTemplate;
}

// Play Sound Settings
// Loads up the settings for the play sound effect type.
function playSoundSettings(){
    var effectTemplate = `
        <div class="effect-specific-title"><h4>What sound should I play?</h4></div>

        <div class="effect-specific-title"><h4>How loud should it be?</h4></div>
    `;
    return effectTemplate;
}

// Show Image Settings
// Loads up the settings for the show image effect type.
function showImageSettings(){
    var effectTemplate = `
        <div class="effect-specific-title"><h4>Which image should I show?</h4></div>

        <div class="effect-specific-title"><h4>What location should it show in?</h4></div>

        <div class="effect-specific-title"><h4>How long should it show?</h4></div>
    `;
    return effectTemplate;
}

// Delete Functionality
// This button deletes functionality on the button settings page.
function deleteFunctionality(uniqueid){
    $('.panel'+uniqueid).remove();
}

//////////////////////
// On Click Functions
/////////////////////

// Button that adds more functionality in settings area.
$( ".add-more-functionality button" ).click(function() {
    addMoreFunctionality();
});