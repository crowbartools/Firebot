const dataAccess = require('./data-access');

// This file centralizes access to the settings db
// We will need to refactor other files to use this.

function getSettingsFile() {
  return dataAccess.getJsonDbInUserData("/user-settings/settings");
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

settings.getLastBoardName = function() {
  var boardName = getDataFromFile('/interactive/lastBoard');    
  return boardName != null ? boardName : "";
}

settings.hasJustUpdated = function() {
  var updated = getDataFromFile('/settings/justUpdated');
  return updated != null ? updated : false;
}

settings.setJustUpdated = function(justUpdated) {
  pushDataToFile('/settings/justUpdated', justUpdated === true);
}

settings.getOverlayVersion = function() {
  var version = getDataFromFile('/settings/copiedOverlayVersion');
  return version != null ? version : "";
}

settings.setOverlayVersion = function(newVersion) {
  pushDataToFile('/settings/copiedOverlayVersion', newVersion.toString());
}

settings.getSparkExemptUsers = function() {
  var exemptUsers = getDataFromFile("/sparkExempt");
  return exemptUsers ? exemptUsers : { users : [] };
}

settings.getClearCustomScriptCache = function() {
  var clear = getDataFromFile('/settings/clearCustomScriptCache');
  return clear != null ? clear : false;
}

settings.setClearCustomScriptCache = function(clear) {
  pushDataToFile('/settings/clearCustomScriptCache', clear === true)
}

settings.useOverlayInstances = function() {
  var oi = getDataFromFile('/settings/useOverlayInstances');
  return oi != null ? oi : false;
}

settings.getOverlayInstances = function() {
  var ois = getDataFromFile('/settings/overlayInstances');
  return ois != null ? ois : [];
}

settings.backupKeepAll = function() {
  var backupKeepAll = getDataFromFile('/settings/backupKeepAll');
  return backupKeepAll != null ? backupKeepAll : false;
}

settings.backupOnExit = function() {
  var backupOnExit = getDataFromFile('/settings/backupOnExit');
  return backupOnExit != null ? backupOnExit : false;
}

settings.backupBeforeUpdates = function() {
  var backupBeforeUpdates = getDataFromFile('/settings/backupBeforeUpdates');
  return backupBeforeUpdates != null ? backupBeforeUpdates : false;
}

settings.getWebSocketPort = function() {
  var websocketPort = getDataFromFile('/settings/websocketPort');
  return websocketPort != null ? websocketPort : 8080;
}

settings.getWebServerPort = function() {
  var serverPort = getDataFromFile('/settings/webServerPort');
  return serverPort != null ? serverPort : 7473;
}

/*
* 0 = off,
* 1 = bugfix,
* 2 = feature,
* 3 = major release,
* 4 = betas
*/
settings.getAutoUpdateLevel = function() {
  var updateLevel = getDataFromFile('/settings/autoUpdateLevel');
  return updateLevel != null ? updateLevel : 2;
}

exports.settings = settings;