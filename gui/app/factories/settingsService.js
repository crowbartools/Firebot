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
    
    factory.getLastBoardName = function() {
      try{
          // Get last board name.
          var boardName = getSettingsFile().getData('/interactive/lastBoard');
  
          return boardName;
      } catch(err){};
    }
    
    factory.setLastBoardName = function(name) {
      getSettingsFile().push('/interactive/lastBoard', name);
    }
    
    return factory;
  });
})();