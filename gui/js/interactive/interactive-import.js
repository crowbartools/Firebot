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
        var dbControls = new JsonDB("./user-settings/controls/"+gameName, true, false);
        dbControls.push('/beam', gameJson);

        // Build Scenes and buttons
        controlsBuilder(gameJson);

        // Change Board Name
        $('.board-title a').attr('href', 'https://beam.pro/i/studio').text(gameName);

        // Add to board menu.
        
    });
}

// Controls Builder
// This takes info and builds out scenes.
function controlsBuilder(scenes){
    // Template for tabs.
    var boardTemplate = `
    <ul class="nav nav-tabs interactive-tab-nav" role="tablist">
        <li role="presentation" class="active"><a href="#settings" aria-controls="settings" role="tab" data-toggle="tab">Settings</a></li>
    </ul>
    <div class="tab-content">
        <div role="tabpanel" class="tab-pane active" id="settings">
            This is where all of the settings will go for this particular board, such as which tabs are default for which groups.
        </div>
    </div>
    `;

    // Throw template on page.
    $('.interactive-board-container').html(boardTemplate);

    // For every scene in the JSON put in a tab.
    for (var i = 0; i < scenes.length; i++) { 
        $('.interactive-tab-nav').append('<li role="presentation"><a href="#'+i+'-scene" aria-controls="'+i+'-scene" scene="'+scenes[i].sceneID+'" role="tab" data-toggle="tab">'+scenes[i].sceneID+'</a></li>');
        $('.tab-content').append('<div role="tabpanel" class="tab-pane" id="'+i+'-scene" scene="'+scenes[i].sceneID+'"></div>');
    }

    // Initialize the tab menu.
    $('.interactive-tab-nav a').click(function (e) {
        e.preventDefault()
        $(this).tab('show')
    })

    // Start up the button builder
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
                    <div class="interactive-button">${controlID} - ${buttontext} - ${sparkcost}</div>
                `;

                // Throw button on the correct pane.
                $('.interactive-board-container .tab-content .tab-pane[scene="'+sceneName+'"]').append(buttonTemplate);
            }
        }
    }
}


// On Click Functions
// Kicking import script on save button press.
$( ".add-new-board-save" ).click(function() {
    importBoardModal();
});