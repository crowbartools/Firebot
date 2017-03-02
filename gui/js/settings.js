// Requirements
const JsonDB = require('node-json-db');

// Settings Save
function settingsSave(){
    var dbSettings = new JsonDB("./user-settings/settings", true, false);

    var betaOptIn = $('.betaOptIn select option:selected').val();
    var updateNotify = $('.updateNotify select option:selected').val();
    var showTips = $('.showTips select option:selected').val();
    var mediaCompatibility = $('.image-compatibility select option:selected').val();
    var gameEmulator = $('.emulation-type select option:selected').val();
    var mouseClick = $('.mouse-clicks select option:selected').val();
    var mouseSpeed = $('.mouse-speed input').val();

    dbSettings.push("/betaOptIn", betaOptIn);
    dbSettings.push("/updateNotify", updateNotify)
    dbSettings.push("/showTips", showTips);
    dbSettings.push("/interactive/mediaCompatibility", mediaCompatibility);
    dbSettings.push("/interactive/emulator", gameEmulator);
    dbSettings.push("/interactive/mouse/mouseClick", mouseClick);
    dbSettings.push("/interactive/mouse/mouseSpeed", mouseSpeed);

    // Fade the button row out and back in again to give the user
    // a form of feedback that the button(s) has been activated.
    $(".settings-save-close").fadeOut(500).delay(500).fadeIn(1000);

    // Call reload of data from database after saving.
    settingsReset();
}

// Settings Reset
function settingsReset(cancelled){
    var dbSettings = new JsonDB("./user-settings/settings", true, false);

    try{
        var betaOptIn = dbSettings.getData('/betaOptIn');
        var updateNotify = dbSettings.getData('/updateNotify');
        var showTips = dbSettings.getData('/showTips');
        var mediaCompatibility = dbSettings.getData("/interactive/mediaCompatibility");
        var gameEmulator = dbSettings.getData('/interactive/emulator');
        var mouseClick = dbSettings.getData('/interactive/mouse/mouseClick');
        var mouseSpeed = dbSettings.getData('/interactive/mouse/mouseSpeed');

        $('.betaOptIn select option[value='+betaOptIn+']').prop('selected', true);
        $('.updateNotify select option[value='+updateNotify+']').prop('selected', true);
        $('.showTips select option[value='+showTips+']').prop('selected', true);
        $('.image-compatibility select option[value='+mediaCompatibility+']').prop('selected', true);
        $('.emulation-type select option[value='+gameEmulator+']').prop('selected', true);
        $('.mouse-clicks select option[value='+mouseClick+']').prop('selected', true);
        $('.mouse-speed input').val(mouseSpeed);

        // Check if user pushed the cancel button to trigger settingReset or not.
        // If the button was used, trigger an animation of the button row.
        if(cancelled == 'cancelled'){
            $(".settings-save-close").fadeOut(500).delay(500).fadeIn(1000);
        }

        // Show or hide tip based on settings.
        if(showTips == "no"){
            $('.interactive-tip').fadeOut('fast');
            $('.row').css('margin-bottom','0px');
        } else {
            $('.interactive-tip').fadeIn('fast');
            $('.row').css('margin-bottom','20px');
        }

        // Show or hide update based on settings
        if(updateNotify == "no"){
            $('.updated-version').fadeOut('fast');
        } else {
            $('.updated-version').fadeIn('fast');
        }

    } catch(err){
        console.log(err);
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
    settingsReset('cancelled');
});

// Run on app start
settingsReset();
