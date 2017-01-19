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

    settingsReset();
}

// Settings Reset
function settingsReset(){
    var dbSettings = new JsonDB("./user-settings/settings", true, false);

    var botType = dbSettings.getData('/botType');
    var gameEmulator = dbSettings.getData('/interactive/emulator');
    var mouseClick = dbSettings.getData('/interactive/mouse/mouseClick');
    var mouseSpeed = dbSettings.getData('/interactive/mouse/mouseSpeed');

    $('.botType select option[value='+botType+']').prop('selected', true);
    $('.emulation-type select option[value='+gameEmulator+']').prop('selected', true);
    $('.mouse-clicks select option[value='+mouseClick+']').prop('selected', true);
    $('.mouse-speed input').val(mouseSpeed);
}

// Settings Save
// This monitors the save button and saves settings on press.
$( ".settings-save" ).click(function() {
    settingsSave();
});

// Settings Cancel
// This monitors the cancel button and clears all fields or set them to default.
$( ".settings-cancel" ).click(function() {
    settingsReset();
});

// Run on app start
settingsReset();