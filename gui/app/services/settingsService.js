(function(){
  
 //This handles settings access for frontend
 
 const dataAccess = require('../../lib/common/data-access.js');
 
 const _ = require('underscore')._;
 const fs = require('fs');

 angular
  .module('firebotApp')
  .factory('settingsService', function (utilityService) {
    var service = {};
    
    var settingsCache = {}
    
    function getSettingsFile() {
      return dataAccess.getJsonDbInUserData("/user-settings/settings");
    }
    
    function pushDataToFile(path, data) {
      try {
          getSettingsFile().push(path, data);
          settingsCache[path] = data;
      } catch(err){};
    }
    
    function getDataFromFile(path, forceCacheUpdate) {
      try{
        if(settingsCache[path] == null || forceCacheUpdate) {
          var data = getSettingsFile().getData(path);
          settingsCache[path] = data;
        }          
      } catch(err){};
      return settingsCache[path];
    }
    
    function deleteDataAtPath(path) {
      getSettingsFile().delete(path);
      delete settingsCache[path];
    }
    
    service.getLastBoardName = function() {
      var boardName = getDataFromFile('/interactive/lastBoard');    
      return boardName != null ? boardName : "";
    }
    
    service.getKnownBoards = function() {
      // This feeds the boardService with known boards and their lastUpdated values.
      var boards = getDataFromFile('/boards');
      return boards;
    }

    service.getBoardLastUpdatedDatetimeById = function(id) {
      // Preparing for data from settings.json/boards/$boardId/lastUpdated
      var lastUpdatedDatetime = null;
      // Check if data is present for given board
      try{
        lastUpdatedDatetime = getDataFromFile(`/boards/${id}/lastUpdated`);
      }catch(err){
        // TODO: We neet some handling of this error here, not quite sure what... 2am, might be better at 9am.. xD
        console.log("We encountered an error, most likely there are no boards in file so we need to build the boards and save them first");
      }
      return lastUpdatedDatetime;
    }

    service.setBoardLastUpdatedDatetimeById = function(boardId,boardDate) {
      // Building the board with ID and lastUpdated before pushing to settings
      var settingsBoard = {
        boardId: boardId,
        lastUpdated: boardDate
      }
      pushDataToFile(`/boards/${boardId}`, settingsBoard);
    }

    service.setLastBoardName = function(name) {
      pushDataToFile('/interactive/lastBoard', name);
    }
    
    service.deleteLastBoardName = function(boardId) {
      deleteDataAtPath('/interactive/lastBoard');
      // Removing the board from settings
      deleteDataAtPath('/boards/'+boardId);
    }
    
    service.getCustomScriptsEnabled = function() {
      return getDataFromFile('/settings/runCustomScripts') == true;
    }
    
    service.setCustomScriptsEnabled = function(enabled) {
      pushDataToFile('/settings/runCustomScripts', enabled == true);
    }
    
    service.isBetaTester = function() {
      var betaTester =  getDataFromFile('/settings/beta');
      return betaTester != null ? betaTester : "No";
    }
    
    service.setBetaTester = function(isTester) {
      pushDataToFile('/settings/beta', isTester);
    }
    
    service.getEmulator = function() {
      var emulator = getDataFromFile('/settings/emulation');
      return emulator != null ? emulator : "Robotjs";
    }
    
    service.setEmulator = function(emulator) {
      pushDataToFile('/settings/emulation', emulator);
    }
    
    service.getOverlayCompatibility = function() {
      var overlay = getDataFromFile('/settings/overlayImages');
      return overlay != null ? overlay : "Other";
    }
    
    service.setOverlayCompatibility = function(overlay) {
      var overlaySetting = overlay === 'OBS' ? overlay : 'Other'
      pushDataToFile('/settings/overlayImages', overlaySetting);
    }

    service.getTheme = function() {
      var theme = getDataFromFile('/settings/theme');
      return theme != null ? theme : "Light";
    }
    
    service.setTheme = function(theme) {
      pushDataToFile('/settings/theme', theme);
    }
    
    service.soundsEnabled = function() {
      var sounds = getDataFromFile('/settings/sounds');
      return sounds != null ? sounds : "On";
    }
    
    service.setSoundsEnabled = function(enabled) {
      pushDataToFile('/settings/sounds', enabled);
    }
    
    /*
    * 0 = off,
    * 1 = bugfix,
    * 2 = feature,
    * 3 = major release,
    * 4 = betas
    */
    service.getAutoUpdateLevel = function() {
      var updateLevel = getDataFromFile('/settings/autoUpdateLevel');
      return updateLevel != null ? updateLevel : 2;
    }
    
    service.setAutoUpdateLevel = function(updateLevel) {
      pushDataToFile('/settings/autoUpdateLevel', updateLevel)
    }
    
    service.notifyOnBeta = function() {
      var beta = getDataFromFile('/settings/notifyOnBeta');
      return beta != null ? beta : false;
    }
    
    service.setNotifyOnBeta = function(beta) {
      pushDataToFile('/settings/notifyOnBeta', beta === true)
    }
    
    service.isFirstTimeUse = function() {
      var ftu = getDataFromFile('/settings/firstTimeUse');
      return ftu != null ? ftu : true;
    }
    
    service.setFirstTimeUse = function(ftu) {
      pushDataToFile('/settings/firstTimeUse', ftu === true)
    }
    
    service.hasJustUpdated = function() {
      var updated = getDataFromFile('/settings/justUpdated');
      return updated != null ? updated : false;
    }
    
    service.setJustUpdated = function(justUpdated) {
      pushDataToFile('/settings/justUpdated', justUpdated === true)
    }
    
    service.getButtonViewMode = function(type) {
      if(type == "commands"){
        var buttonViewMode = getDataFromFile('/settings/buttonViewModeCommands');
      } else {
        var buttonViewMode = getDataFromFile('/settings/buttonViewMode');
      }
      return buttonViewMode != null ? buttonViewMode : 'grid';
    }
    
    service.setButtonViewMode = function(buttonViewMode, type) {
      if(type == "commands"){
        pushDataToFile('/settings/buttonViewModeCommands', buttonViewMode)
      } else {
        pushDataToFile('/settings/buttonViewMode', buttonViewMode)
      }
    }
    
    service.getOverlayVersion = function() {
      var version = getDataFromFile('/settings/copiedOverlayVersion');
      return version != null ? version : "";
    }
    
    service.setOverlayVersion = function(newVersion) {
      pushDataToFile('/settings/copiedOverlayVersion', newVersion.toString());
    }

    service.getWebServerPort = function() {
      var serverPort = getDataFromFile('/settings/webServerPort');
      return serverPort != null ? serverPort : 7473;
    }
    
    service.getWebSocketPort = function() {
      var websocketPort = getDataFromFile('/settings/websocketPort');
      return websocketPort != null ? websocketPort : 8080;
    }
    
    service.setWebSocketPort = function(port) {
      // Ensure port is a number.
      if(!Number.isInteger(port)) { return; }
      
      // Save to settings file for app front end
      pushDataToFile('/settings/websocketPort', port);
      
      var path = dataAccess.getPathInWorkingDir("/resources/overlay/js/port.js");

      // Overwrite the 'port.js' file in the overlay settings folder with the new port
      fs.writeFile(path, `window.WEBSOCKET_PORT = ${port}`, 
        'utf8', () => { console.log(`Set overlay port to: ${port}`)});
    }
      
    service.showOverlayInfoModal = function(instanceName) {
      utilityService.showOverlayInfoModal(instanceName);
    }
    
    service.getClearCustomScriptCache = function() {
      var clear = getDataFromFile('/settings/clearCustomScriptCache');
      return clear != null ? clear : false;
    }
    
    service.setClearCustomScriptCache = function(clear) {
      pushDataToFile('/settings/clearCustomScriptCache', clear === true)
    }
    
    service.useOverlayInstances = function() {
      var oi = getDataFromFile('/settings/useOverlayInstances');
      return oi != null ? oi : false;
    }
    
    service.setUseOverlayInstances = function(oi) {
      pushDataToFile('/settings/useOverlayInstances', oi === true)
    }
    
    service.getOverlayInstances = function() {
      var ois = getDataFromFile('/settings/overlayInstances');
      return ois != null ? ois : [];
    }
    
    service.setOverlayInstances = function(ois) {
      pushDataToFile('/settings/overlayInstances', ois)
    }

    service.backupKeepAll = function() {
      var backupKeepAll = getDataFromFile('/settings/backupKeepAll');
      return backupKeepAll != null ? backupKeepAll : false;
    }
    
    service.setBackupKeepAll = function(backupKeepAll) {
      pushDataToFile('/settings/backupKeepAll', backupKeepAll === true)
    }

    service.backupOnExit = function() {
      var save = getDataFromFile('/settings/backupOnExit');
      return save != null ? save : false;
    }
    
    service.setBackupOnExit = function(backupOnExit) {
      pushDataToFile('/settings/backupOnExit', backupOnExit === true)
    }
    
    service.backupBeforeUpdates = function() {
      var backupBeforeUpdates = getDataFromFile('/settings/backupBeforeUpdates');
      return backupBeforeUpdates != null ? backupBeforeUpdates : false;
    }
    
    service.setBackupBeforeUpdates = function(backupBeforeUpdates) {
      pushDataToFile('/settings/backupBeforeUpdates', backupBeforeUpdates === true)
    }

    return service;
  });
})();