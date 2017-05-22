const beamInteractive = require('../beam-interactive');

// Change Group
function changeGroup(participant, effect){
    var groupid = effect.scene;
    beamInteractive.changeGroups(participant, groupid);
}

// Export Functions
exports.go = changeGroup;