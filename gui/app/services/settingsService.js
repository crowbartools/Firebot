(function(){
  
 //This handles settings access for frontend
 
 const _ = require('underscore')._;
 const JsonDB = require('node-json-db');

 angular
  .module('firebotApp')
  .factory('settingsService', function () {
    var factory = {};
    
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
    
    factory.getLastBoardName = function() {
      var boardName = getDataFromFile('/interactive/lastBoard');    
      return boardName != null ? boardName : "";
    }
    
    factory.setLastBoardName = function(name) {
      pushDataToFile('/interactive/lastBoard', name);
    }
    
    factory.getCustomScriptsEnabled = function() {
      return getDataFromFile('/settings/runCustomScripts') == true;
    }
    
    factory.setCustomScriptsEnabled = function(enabled) {
      pushDataToFile('/settings/runCustomScripts', enabled == true);
    }
    
    factory.isBetaTester = function() {
      var betaTester =  getDataFromFile('/settings/beta');
      return betaTester != null ? betaTester : "No";
    }
    
    factory.setBetaTester = function(isTester) {
      pushDataToFile('/settings/beta', isTester);
    }
    
    factory.getEmulator = function() {
      var emulator = getDataFromFile('/settings/emulation');
      return emulator != null ? emulator : "KBMRobot";
    }
    
    factory.setEmulator = function(emulator) {
      pushDataToFile('/settings/emulation', emulator);
    }
    
    factory.getOverlayCompatibility = function() {
      var overlay = getDataFromFile('/settings/overlayImages');
      return overlay != null ? overlay : "Other";
    }
    
    factory.setOverlayCompatibility = function(overlay) {
      pushDataToFile('/settings/overlayImages', overlay);
    }
    
    factory.soundsEnabled = function() {
      var sounds = getDataFromFile('/settings/sounds');
      return sounds != null ? sounds : "On";
    }
    
    factory.setSoundsEnabled = function(enabled) {
      pushDataToFile('/settings/sounds', enabled);
    }    
    
    return factory;
  });
})();