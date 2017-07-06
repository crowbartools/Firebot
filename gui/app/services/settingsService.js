(function(){
  
 //This handles settings access for frontend
 
 const _ = require('underscore')._;
 const JsonDB = require('node-json-db');
 const fs = require('fs');

 angular
  .module('firebotApp')
  .factory('settingsService', function () {
    var service = {};
    
    var settingsCache = {}
    
    function getSettingsFile() {
      return new JsonDB("./user-settings/settings", true, true);
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
      return emulator != null ? emulator : "KBMRobot";
    }
    
    service.setEmulator = function(emulator) {
      pushDataToFile('/settings/emulation', emulator);
    }
    
    service.getOverlayCompatibility = function() {
      var overlay = getDataFromFile('/settings/overlayImages');
      return overlay != null ? overlay : "Other";
    }
    
    service.setOverlayCompatibility = function(overlay) {
      pushDataToFile('/settings/overlayImages', overlay);
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
    
    service.isFirstTimeUse = function() {
      var ftu = getDataFromFile('/settings/firstTimeUse');
      return ftu != null ? ftu : true;
    }
    
    service.setFirstTimeUse = function(ftu) {
      pushDataToFile('/settings/firstTimeUse', ftu === true)
    }
    
    service.getButtonViewMode = function() {
      var buttonViewMode = getDataFromFile('/settings/buttonViewMode');
      return buttonViewMode != null ? buttonViewMode : 'grid';
    }
    
    service.setButtonViewMode = function(buttonViewMode) {
      pushDataToFile('/settings/buttonViewMode', buttonViewMode)
    }
    
    service.getWebSocketPort = function() {
      var websocketPort = getDataFromFile('/settings/websocketPort');
      return websocketPort != null ? websocketPort : 8080;
    }
    
    service.setWebSocketPort = function(port) {
      // Verify port is a number. This might be overly safe.
      if(!Number.isInteger(port)) { return; }
      
      // Save to settings file for app front end
      pushDataToFile('/settings/websocketPort', port);

      // Overwrite the 'port.js' file in the overlay settings folder with the new port
      fs.writeFile('./user-settings/overlay-settings/port.js', `window.WEBSOCKET_PORT = ${port}`, 
        'utf8', () => { console.log(`Set overlay port to: ${port}`)});
    }      
    
    return service;
  });
})();