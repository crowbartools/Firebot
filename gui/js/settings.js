// Requirements
const JsonDB = require('node-json-db');

// Settings Save
function settingsSave(){
    var dbSettings = new JsonDB("./user-settings/settings", true, false);

    var botType = $('.botType select option:selected').val();
    var gameEmulator = $('.emulation-type select option:selected').val();
    var mouseClick = $('.mouse-clicks select option:selected').val();
    var mouseSpeed = $('.mouse-speed input').val();

    dbSettings.push("/botType", botType);
    dbSettings.push("/interactive/emulator", gameEmulator);
    dbSettings.push("/interactive/mouse/mouseClick", mouseClick);
    dbSettings.push("/interactive/mouse/mouseSpeed", mouseSpeed);

    // Fade the button row out and back in again to give the user
    // a form of feedback that the button(s) has been activated.
    $(".settings-save").empty().html('<i class="fa fa-thumbs-up" aria-hidden="true"></i>');
    setTimeout(function () {
        $('.settings-save').html('Save');
    }, 1000);

    // Call reload of data from database after saving.
    settingsReset();
}

// Settings Reset
function settingsReset($cancelled){
    var dbSettings = new JsonDB("./user-settings/settings", true, false);

    var botType = dbSettings.getData('/botType');
    var gameEmulator = dbSettings.getData('/interactive/emulator');
    var mouseClick = dbSettings.getData('/interactive/mouse/mouseClick');
    var mouseSpeed = dbSettings.getData('/interactive/mouse/mouseSpeed');

    $('.botType select option[value='+botType+']').prop('selected', true);
    $('.emulation-type select option[value='+gameEmulator+']').prop('selected', true);
    $('.mouse-clicks select option[value='+mouseClick+']').prop('selected', true);
    $('.mouse-speed input').val(mouseSpeed);

    // Check if user pushed the cancel button to trigger settingReset or not.
    // If the button was used, trigger an animation of the button row.
    if($cancelled === 1){

        $(".settings-cancel").empty().html('<i class="fa fa-thumbs-up" aria-hidden="true"></i>');
        setTimeout(function () {
            $('.settings-cancel').html('Cancel');
        }, 1000);

    }
}

// Settings Save
// This monitors the save button and saves settings on press.
$( ".settings-save" ).click(function() {
    settingsSave();
});

// Settings Cancel
// This monitors the cancel button and clears all fields or set them to default.
$( ".settings-cancel" ).click(function() {
    var $cancelled = 1;
    settingsReset($cancelled);
});

// Run on app start
settingsReset();
