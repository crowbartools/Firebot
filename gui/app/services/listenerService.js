(function(){
  
 // This contains helps handle listening to events coming from the backend
 
 const _ = require('underscore')._;

 angular
  .module('firebotApp')
  .factory('listenerService', function ($uibModal) {
    var service = {};
      
    var registeredFileGotListeners = {};
    
    service.registerFileGotListener = function(uuid, callback) {
      registeredFileGotListeners[uuid] = callback;
    }
    service.unregisterFileGotListener = function(uuid) {
      delete registeredFileGotListeners[uuid];
    }
    
    ipcRenderer.on('gotSoundFilePath', function (event, data){
      var uniqueid = data.id;
      var filepath = "";
      if(data.path != null) {
        filepath = data.path[0];
      }
      
      var listener = registeredFileGotListeners[uniqueid];
      if(typeof listener === 'function') {
        listener(filepath);
      }
    });
    
    return service;
  });
})();