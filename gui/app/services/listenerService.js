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
      connectionChangeRequest: {},
      eventLog: {},
      error: {},
      updateError: {},
      updateDownloaded: {},
      playSound: {},
      showImage: {},
      showVideo: {},
      showHtml: {},
      celebrate: {}
    }
    
    var ListenerType = {
      IMAGE_FILE: "imageFile",
      SOUND_FILE: "soundFile",
      VIDEO_FILE: "videoFile",
      IMPORT_FOLDER: "importFolder",
      CONNECTION_STATUS: "connectionStatus",
      CONNECTION_CHANGE_REQUEST: "connectionChangeRequest",
      EVENT_LOG: "eventLog",
      ERROR: "error",
      UPDATE_ERROR: "updateError",
      UPDATE_DOWNLOADED: "updateDownloaded",
      PLAY_SOUND: "playSound",
      SHOW_IMAGE: "showImage",
      SHOW_VIDEO: "showVideo",
      SHOW_HTML: "showHtml",
      CELEBREATE: "celebrate"
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
        case ListenerType.VIDEO_FILE:
        case ListenerType.IMAGE_FILE:
        case ListenerType.SOUND_FILE:
        case ListenerType.IMPORT_FOLDER:
          registeredListeners.filePath[uuid] = listener;
          if(publishEvent) {
            if(listener.type == ListenerType.IMAGE_FILE) {
              ipcRenderer.send('getImagePath', uuid);
            }
            else if(listener.type == ListenerType.SOUND_FILE) {
              ipcRenderer.send('getSoundPath', uuid);
            }
            else if(listener.type == ListenerType.VIDEO_FILE) {
              ipcRenderer.send('getVideoPath', uuid);
            }
            else if(listener.type == ListenerType.IMPORT_FOLDER) {
              ipcRenderer.send('getImportFolderPath', uuid);
            }
          }
          break;
        default:
          registeredListeners[listener.type][uuid] = listener;
      }
    }
    
    service.unregisterListener = function(type, uuid) {
      switch(type) {
        case ListenerType.VIDEO_FILE:
        case ListenerType.IMAGE_FILE:
        case ListenerType.SOUND_FILE:
        case ListenerType.IMPORT_FOLDER:
          delete registeredListeners.filePath[uuid];
          break;
        default:
          delete registeredListeners[type][uuid];
      }
    }
    
    /*
    * Events
    */
    var EventType = {
      DOWNLOAD_UPDATE: "downloadUpdate",
      OPEN_ROOT: "openRootFolder",
      GET_IMAGE: "getImagePath",
      GET_SOUND: "getSoundPath",
      GET_VIDEO: "getVideoPath",
      SPARK_EXEMPT_UPDATED: "sparkExemptUpdated"
    }  
    service.EventType = EventType;
    
    service.fireEvent = function(type, data) {
      ipcRenderer.send(type, data);
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

    ipcRenderer.on('gotVideoFilePath', function (event, data){
        parseFilePathEvent(data);
    });
    
    ipcRenderer.on('gotImportFolderPath', function (event, data){
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
    * Event log event listener
    */
    ipcRenderer.on('eventlog', function (event, data){
      _.forEach(registeredListeners.eventLog, (listener, key, list) => {
        runListener(listener, data);
      });
    });
    
    /**
    * Error event listener
    */
    ipcRenderer.on('error', function (event, errorMessage){
      _.forEach(registeredListeners.error, (listener, key, list) => {
        runListener(listener, errorMessage);
      });
    });

    /**
    * Update error listener
    */
    ipcRenderer.on('updateError', function (event, errorMessage){
      _.forEach(registeredListeners.updateError, (listener, key, list) => {
        runListener(listener, errorMessage);
      });
    });
    
    /**
    * Update download listener
    */
    ipcRenderer.on('updateDownloaded', function (){
      _.forEach(registeredListeners.updateDownloaded, (listener, key, list) => {
        runListener(listener);
      });
    });
    
    /**
    * Show img event listener
    */
    ipcRenderer.on('showimage', function (event, data){
      _.forEach(registeredListeners.showImage, (listener, key, list) => {
        runListener(listener, data);
      });
    });
    
    /**
    * Show video event listener
    */
    ipcRenderer.on('showvideo', function (event, data){
      _.forEach(registeredListeners.showVideo, (listener, key, list) => {
        runListener(listener, data);
      });
    });
    
    /**
    * Show html event listener
    */
    ipcRenderer.on('showhtml', function (event, data){
      _.forEach(registeredListeners.showHtml, (listener, key, list) => {
        runListener(listener, data);
      });
    });
    
    /**
    * Play sound event listener
    */
    ipcRenderer.on('playsound', function (event, data){
      _.forEach(registeredListeners.playSound, (listener, key, list) => {
        runListener(listener, data);
      });
    });
    
    /**
     *  Show Celebration animation
     */
    ipcRenderer.on('celebrate', function (event, data){
      _.forEach(registeredListeners.celebrate, (listener, key, list) => {
        runListener(listener, data);
      });
    });
    
    
    /**
    *  Helpers
    */
        
    function runListener(listener, returnPayload) {
      if(listener != null) {
        var callback = listener.callback;
        if(typeof callback === 'function') {
          // $q is angulars implementation of the promise protocol. We are creating and instantly resolving a promise, then we run the callback.
          // This simply ensures any scope varibles are updated if needed.
          $q.resolve(true, () => callback(returnPayload))
        }
        if(listener.runOnce == true) {
          service.unregisterListener(listener.type, listener.uuid);
        }
      } 
    }
    
    return service;
  });
})();