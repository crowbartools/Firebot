(function(){
  
 //This handles settings access for frontend
 
 const _ = require('underscore')._;
 const JsonDB = require('node-json-db');

 angular
  .module('firebotApp')
  .factory('settingsService', function () {
    var service = {};
    
    function getSettingsFile() {
      return new JsonDB("./user-settings/settings", true, true);
    }
    
    function pushDataToFile(path, data) {
      try {
          getSettingsFile().push(path, data);
      } catch(err){};
    }
    
    function getDataFromFile(path) {
      var data = null;
      try{
          data = getSettingsFile().getData(path);
      } catch(err){};
      return data
    }
    
    service.getLastBoardName = function() {
      var boardName = getDataFromFile('/interactive/lastBoard');    
      return boardName != null ? boardName : "";
    }
    
    service.setLastBoardName = function(name) {
      pushDataToFile('/interactive/lastBoard', name);
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
    
    service.soundsEnabled = function() {
      var sounds = getDataFromFile('/settings/sounds');
      return sounds != null ? sounds : "On";
    }
    
    service.setSoundsEnabled = function(enabled) {
      pushDataToFile('/settings/sounds', enabled);
    }    
    
    return service;
  });
})();