const JsonDB = require('node-json-db');

// This file centralizes access to the settings db
// We will need to refactor other files to use this.

function runCustomScripts() {
  var dbSettings = new JsonDB('./user-settings/settings', true, false);
  
  // default to false
  var runCustomScripts = false;
  try{
  	runCustomScripts = 
      (dbSettings.getData('./settings/runCustomScripts') === true);
  } catch(err) {}
  
  return runCustomScripts;
}

exports.runCustomScripts = runCustomScripts;