(function(){
  
 // This contains helps handle listening to events coming from the backend
 
 const _ = require('underscore')._;

 angular
  .module('firebotApp')
  .factory('listenerService', function ($uibModal) {
    var service = {};
    
    var registeredListeners = {
      soundFiles = {},
      imageFiles = {}
    }
    
    service.registerSoundFileListener = function(uuid, callback) {
      registeredListeners.soundFiles[uuid] = callback;
    }
    service.unregisterSoundFileListener = function(uuid) {
      delete registeredListeners.soundFiles[uuid];
    }
    
    service.registerImageFileListener = function(uuid, callback) {
      registeredListeners.imageFiles[uuid] = callback;
    }
    service.unregisterImageFileListener = function(uuid) {
      delete registeredListeners.imageFiles[uuid];
    }
    
    ipcRenderer.on('gotSoundFilePath', function (event, data){
      var uniqueid = data.id;
      var filepath = "";
      if(data.path != null) {
        filepath = data.path[0];
      }
      
      var listener = registeredListeners.soundFiles[uniqueid];
      if(typeof listener === 'function') {
        listener(filepath);
      }
    });
    
    ipcRenderer.on('gotImageFilePath', function (event, data){
        var uniqueid = data.id;
        var filepath = "";
        if(data.path != null) {
          filepath = data.path[0];
        }
        
        var listener = registeredListeners.imageFiles[uniqueid];
        if(typeof listener === 'function') {
          listener(filepath);
        }
      });
    
    return service;
  });
})();