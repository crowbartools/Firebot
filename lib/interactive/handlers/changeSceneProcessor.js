const JsonDB = require('node-json-db');
const mixerInteractive = require('../mixer-interactive');

// Change Group
function changeScene(effect, firebot){
    var firebotGroupArray = [];

    if(effect.reset === true){

        // We're resetting all groups back to default.
        var scenes = firebot.scenes;

        // Get list of viable groups to compare against.
        for (scene in scenes){
            var groups = scenes[scene].default;
            for (group in groups){
                var groupID = groups[group];
                if(groupID !== "None"){
                    firebotGroupArray.push(groupID);
                }
            }
        }
        // Always push default since it always exists.
        firebotGroupArray.push('default');

        // Loop through scenes
        for (scene in scenes){
            var sceneData = scenes[scene];
            var groups = sceneData.default;

            // Loop through the groups listed as default for this scene and send it of to be changed back.
            for(group of groups){

                // Search valid groups to see if this one is listed.
                var success = firebotGroupArray.filter(function ( success ) {
                    return success === group;
                })[0];

                // Okay, check to see if this group is an active group.
                if(success !== undefined){
                    // This is a valid group send it off!
                    mixerInteractive.changeScenes(group, scene);
                } else if (group !== "None")  {
                    // This is not a valid group. Throw error.
                    renderWindow.webContents.send('error', "Your scene change button tried to switch the scene for an intactive group: "+group+". Make sure this group has a default scene selected on this board. Otherwise, check the settings for this change scene button.");
                }
            }
        }
    } else if (effect.reset === false){

        // We're changing some scenes.
        var scenes = firebot.scenes;

        // Get list of viable groups to compare against.
        for (scene in scenes){
            var groups = scenes[scene].default;
            for (group in groups){
                var groupID = groups[group];
                if(groupID !== "None"){
                    firebotGroupArray.push(groupID);
                }
            }
        }
        // Always push default since it always exists.
        firebotGroupArray.push('default');

        var scene = effect.scene;
        var groups = effect.groups;

        // Loop through groups and change them to the new scene.
        for (group of groups){
            // Search valid groups to see if this one is listed.
            var success = firebotGroupArray.filter(function ( success ) {
                return success === group;
            })[0];

            console.log(group);

            // Check to see if this group is valid or not.
            if(success !== undefined){
                // This group is valid! Change scenes.
                mixerInteractive.changeScenes(group, scene);
            } else if (group !== "None")  {
                // This is not a valid group. Throw error.
                renderWindow.webContents.send('error', "Your scene change button tried to switch the scene for an intactive group: "+group+". Make sure this group has a default scene selected on this board. Otherwise, check the settings for this change scene button.");
            }
        }
    }
}

//mixerInteractive.changeScenes(group, scene);

// Export Functions
exports.go = changeScene;