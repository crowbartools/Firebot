const JsonDB = require('node-json-db');

// This file centralizes access to the settings db
// We will need to refactor other files to use this.

function getSettingsFile() {
  return new JsonDB("./user-settings/settings", true, true);
}

function pushDataToFile(path, data) {
  try {
      getSettingsFile().push(path, data);
  } catch(err){};
}

function getDataFromFile(path, forceCacheUpdate) {
  var data = null;
  try{
    data = getSettingsFile().getData(path);      
  } catch(err){};
  return data;
}

function deleteDataAtPath(path) {
  getSettingsFile().delete(path);
}

var settings = {};
settings.isCustomScriptsEnabled = function() {
  return getDataFromFile('/settings/runCustomScripts') == true;
}

settings.setCustomScriptsEnabled = function(enabled) {
  pushDataToFile('/settings/runCustomScripts', enabled == true);
}

settings.hasJustUpdated = function() {
  var updated = getDataFromFile('/settings/justUpdated');
  return updated != null ? updated : false;
}

settings.setJustUpdated = function(justUpdated) {
  pushDataToFile('/settings/justUpdated', justUpdated === true)
}

exports.settings = settings;