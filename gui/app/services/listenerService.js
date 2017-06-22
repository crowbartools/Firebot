(function(){
  
 // This helps listening to events coming from the backend
 
 const _ = require('underscore')._;

 angular
  .module('firebotApp')
  .factory('listenerService', function ($q) {
    var service = {};
    
    var registeredListeners = {
      filePath: {},
      connectionStatus: {},
      connectionChangeRequest: {}
    }
    
    var ListenerType = {
      IMAGE_FILE: "imageFile",
      SOUND_FILE: "soundFile",
      CONNECTION_STATUS: "connectionStatus",
      CONNECTION_CHANGE_REQUEST: "connectionChangeRequest"
    }
    
    service.ListenerType = ListenerType;
    
    service.registerListener = function(request, callback) {
      var uuid = request.uuid;
      if(uuid == null) {
        uuid = _.uniqueId();
      }
    
      var listener = {
        uuid: uuid,
        type: request.type,
        callback: callback, // the callback when this listener is triggered
        runOnce: request.runOnce == true // Means the listener will remove itself after the first time its called
      }
      
      var publishEvent = request.publishEvent == true;
      
      switch(listener.type) {
        case ListenerType.IMAGE_FILE:
        case ListenerType.SOUND_FILE:
          registeredListeners.filePath[uuid] = listener;
          if(publishEvent) {
            if(listener.type == ListenerType.IMAGE_FILE) {
              ipcRenderer.send('getImagePath', uuid);
            }
            else if(listener.type == ListenerType.SOUND_FILE) {
              ipcRenderer.send('getSoundPath', uuid);
            }
          }
          break;
        case ListenerType.CONNECTION_STATUS:
          registeredListeners.connectionStatus[uuid] = listener;
          // There isn't really a corresponding event to publish for this
          break;
        case ListenerType.CONNECTION_CHANGE_REQUEST:
          registeredListeners.connectionChangeRequest[uuid] = listener;
          break;
      }
    }
    
    service.unregisterListener = function(type, uuid) {
      switch(type) {
        case ListenerType.IMAGE_FILE:
        case ListenerType.SOUND_FILE:
          delete registeredListeners.filePath[uuid];
          break;
        case ListenerType.CONNECTION_STATUS:
          delete registeredListeners.connectionStatus[uuid];
          break;
        case ListenerType.CONNECTION_CHANGE_REQUEST:
          delete registeredListeners.connectionChangeRequest[uuid];
          break;
      }
    }
    
    /**
    * File path event listeners 
    */
    ipcRenderer.on('gotSoundFilePath', function (event, data){
        parseFilePathEvent(data);
    });
    
    ipcRenderer.on('gotImageFilePath', function (event, data){
        parseFilePathEvent(data);
    });
      
    function parseFilePathEvent(data) {
      var uuid = data.id;
      var filepath = "";
      if(data.path != null) {
        filepath = data.path[0];
      }
      
      var listener = registeredListeners.filePath[uuid];
      runListener(listener, filepath);    
    }
    
    /**
    * Connection event listeners 
    */
    
    // Connection Monitor
    // Recieves event from main process that connection has been established or disconnected.
    ipcRenderer.on('connection', function (event, data) {
      var isConnected = data ? (data.toLowerCase() == "online") : false;
      _.forEach(registeredListeners.connectionStatus, (listener, key, list) => {
        runListener(listener, isConnected);
      });
    });
    
    // Connect Request
    // Recieves an event from the main process when the global hotkey is hit for connecting.
    ipcRenderer.on('getRefreshToken', function (event, data) {  
      _.forEach(registeredListeners.connectionChangeRequest, (listener, key, list) => {
        runListener(listener, null);
      });
    });
    
    /**
    *  Helpers
    */
        
    function runListener(listener, returnPayload) {
      if(listener != null) {
        var callback = listener.callback;
        if(typeof callback === 'function') {
          $q(function(resolve, reject) {
              resolve();
            }).then(() => {
              callback(returnPayload);
            });
        }
        if(listener.runOnce == true) {
          service.unregisterListener(listener.type, listener.uuid);
        }
      } 
    }
    
    return service;
  });
})();