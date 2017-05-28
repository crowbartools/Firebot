const mixerInteractive = require('../mixer-interactive');

// Change Group
function changeGroup(participant, effect){
    var groupid = effect.scene;
    mixerInteractive.changeGroups(participant, groupid);
}

// Export Functions
exports.go = changeGroup;