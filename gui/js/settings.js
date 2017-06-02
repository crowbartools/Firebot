

// Overlay Compatibility
$( ".options-overlay-compat-dropdown ul a" ).click(function() {
    var dbSettings = new JsonDB("./user-settings/settings", true, true);
    var setting = $(this).text();

    // Push to db.
    dbSettings.push('./settings/overlayImages', setting);

    // Change dropdown text
    $('.options-overlay-compat-dropdown button .dropdown-text').text(setting);
});

// Beta Tester
$( ".options-beta-dropdown ul a" ).click(function() {
    var dbSettings = new JsonDB("./user-settings/settings", true, true);
    var setting = $(this).text();

    // Push to db.
    dbSettings.push('./settings/beta', setting);

    // Change dropdown text
    $('.options-beta-dropdown button .dropdown-text').text(setting);
});

// Control Emulation
$( ".options-emulation-dropdown ul a" ).click(function() {
    var dbSettings = new JsonDB("./user-settings/settings", true, true);
    var setting = $(this).text();

    // Push to db.
    dbSettings.push('./settings/emulation', setting);

    // Change dropdown text
    $('.options-emulation-dropdown button .dropdown-text').text(setting);
});

// Sounds
$( ".options-sounds-dropdown ul a" ).click(function() {
    var dbSettings = new JsonDB("./user-settings/settings", true, true);
    var setting = $(this).text();

    // Push to db.
    dbSettings.push('./settings/sounds', setting);

    // Change dropdown text
    $('.options-sounds-dropdown button .dropdown-text').text(setting);
});

// Load Settings
// This loads up all usersettings into the UI on app load.
function loadUserSettings(){
    var dbSettings = new JsonDB("./user-settings/settings", true, true);

    // Grab settings and set defaults
    try{
        var overlayCompat = dbSettings.getData('./settings/overlayImages');
    }catch(err){
        var overlayCompat = "OBS";
    }

    try{
        var betaTester = dbSettings.getData('./settings/beta');
    }catch(err){
        var betaTester = "No"
    }

    try{
        var controlEmulation = dbSettings.getData('./settings/emulation');
    }catch(err){
        var controlEmulation = "Robotjs"
    }

    try{
        var controlSounds = dbSettings.getData('./settings/sounds');
    }catch(err){
        var controlSounds = "Off"
    }

    // Throw into ui
    $('.options-overlay-compat-dropdown button .dropdown-text').text(overlayCompat);
    $('.options-beta-dropdown button .dropdown-text').text(betaTester);
    $('.options-emulation-dropdown button .dropdown-text').text(controlEmulation);
    $('.options-sounds-dropdown button .dropdown-text').text(controlSounds);
}

// On App Load
loadUserSettings();