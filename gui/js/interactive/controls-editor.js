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
                            <li><a href="#" uniqueid="${uniqueid}" effect="Delay">Delay</a></li>
                            <li><a href="#" uniqueid="${uniqueid}" effect="Fireworks">Fireworks</a></li>
                            <li><a href="#" uniqueid="${uniqueid}" effect="Game Control">Game Control</a></li>
                            <li><a href="#" uniqueid="${uniqueid}" effect="Play Sound">Play Sound</a></li>
                            <li><a href="#" uniqueid="${uniqueid}" effect="Show Image">Show Image</a></li>
                        </ul>
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

// Delete Functionality
// This button deletes functionality on the button settings page.
function deleteFunctionality(uniqueid){
    $('.panel'+uniqueid).remove();
}

// Functionality Switcher
// This swaps out all of the settings in a panel whtn the type is changed.
function functionalitySwitcher(uniqueid, effect){
    $('.effect-dropdown[uniqueid="'+uniqueid+'"], .panel'+uniqueid+' .panel-title a').text(effect);
}

//////////////////////
// On Click Functions
/////////////////////

// Button that adds more functionality in settings area.
$( ".add-more-functionality button" ).click(function() {
    addMoreFunctionality();
});