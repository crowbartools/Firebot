(function(){
  
 // This provides methods for playing sounds
 
 const _ = require('underscore')._;

 angular
  .module('firebotApp')
  .factory('soundService', function (settingsService) {
    var service = {};
      
    // Connection Sounds
    service.connectSound = function(type){
      if(type == "Online"){
        service.playSound("./sounds/online.mp3", 0.4);

      } else {
        service.playSound("./sounds/offline.mp3", 0.4);
      }
    }
    
    service.playSound = function(path, volume) {
      if(settingsService.soundsEnabled) {
        var sound = new Howl({
             src: [path],
             volume: volume
         });
        sound.play();
      }
    }; 
    
    return service;
  });
})();