const JsonDB = require('node-json-db');

// Cooldown Router
function cooldownRouter(beamControls, beamControl, gameJson, control){
    var cooldown = control.cooldown;
    var cooldownGroup = control.cooldownGroup;

    if(cooldownGroup !== undefined){
        console.log('This button has a cooldown group.');
    } else {
        console.log('This button doesnt have a cooldown group.');
    }

}


// Exports
exports.router = cooldownRouter;