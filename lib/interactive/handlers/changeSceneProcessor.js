const JsonDB = require('node-json-db');
const mixerInteractive = require('../mixer-interactive');

// Change Group
function changeScene(effect, firebot){
    if(effect.reset === true){
        // We're resetting all groups back to default.
        var scenes = firebot.scenes;

        // Loop through scenes
        for (scene in scenes){
            var sceneData = scenes[scene];
            var groups = sceneData.default;

            // Loop through the groups listed as default for this scene and send it of to be changed back.
            for(group of groups){
                console.log('Change scene handler fired.')
                mixerInteractive.changeScenes(group, scene);
            }
        }
    } else if (effect.reset === false){
        // We're changing some scenes.
        var scene = effect.scene;
        var groups = effect.groups;

        // Loop through groups and change them to the new scene.
        for (group of groups){
            mixerInteractive.changeScenes(group, scene);
        }
    }
}

//mixerInteractive.changeScenes(group, scene);

// Export Functions
exports.go = changeScene;