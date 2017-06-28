(function(){
  
 // This provides methods for playing sounds
 
 const _ = require('underscore')._;

 angular
  .module('firebotApp')
  .factory('soundService', function (settingsService, listenerService) {
    var service = {};
      
    // Connection Sounds
    service.connectSound = function(type){
      if(settingsService.soundsEnabled() == "On") {
        if(type == "Online"){
          service.playSound("../sounds/online.mp3", 0.4);
        } else {
          service.playSound("../sounds/offline.mp3", 0.4);
        }
      }
    }
    
    service.playSound = function(path, volume) {
      var sound = new Howl({
           src: [path],
           volume: volume
       });
      sound.play();
    }; 
    
    // Watches for an event from main process    
    listenerService.registerListener(
      { type: listenerService.ListenerType.PLAY_SOUND }, 
      (data) => {
        var filepath = data.filepath;
        var volume = (data.volume / 100) * 10;
        
        service.playSound(filepath, volume);
      });
    
    return service;
  });
})();