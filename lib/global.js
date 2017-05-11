const JsonDB = require('node-json-db');

// Get Current Board
// This function returns the db for the currently selected board.
function getCurrentBoard(){
    // Get the current board.
    var dbSettings = new JsonDB("./app-settings/settings", true, true);
    try{
        // Get last board name.
        var gameName = dbSettings.getData('/interactive/lastBoard');

        // Get settings for last board.
        var dbControls = new JsonDB("./user-settings/controls/"+gameName, true, true);

        return dbControls;
    } catch(err){console.log(err)};
}


// Export Functions
exports.getBoard = getCurrentBoard();