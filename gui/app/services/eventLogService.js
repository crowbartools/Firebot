(function(){
  
 //This handles groups
 
 const _ = require('underscore')._;

 angular
  .module('firebotApp')
  .factory('eventLogService', function ($interval, listenerService) {
    var service = {};
    
    service.events = [];
        
    // Watches for an event from main process    
    listenerService.registerListener(
      { type: listenerService.ListenerType.EVENT_LOG }, 
      (data) => {
        addEvent(data);
      });
    
    function addEvent(data) {
      var username = data.username;
      var text = data.event;
      
      var now = new Date();
      var timeStamp = getTimeStamp(now);
  
      // Tag this item with milliseconds so we can easily purge them later.
      var milliseconds = now.getTime();
      
      service.events.push({
        milliseconds: milliseconds, 
        timestamp: timeStamp, 
        username: username, 
        text: text
      });
    }
    
    // Pretty timestamp
    function getTimeStamp(date) {
        var now = date;
        var time = [ now.getHours(), now.getMinutes(), now.getSeconds() ];
        var suffix = ( time[0] < 12 ) ? "AM" : "PM";
    
        // Convert hour from military time
        time[0] = ( time[0] < 12 ) ? time[0] : time[0] - 12;
    
        // If hour is 0, set it to 12
        time[0] = time[0] || 12;
    
        // If seconds and minutes are less than 10, add a zero
        for ( var i = 1; i < 3; i++ ) {
            if ( time[i] < 10 ) {
            time[i] = "0" + time[i];
            }
        }
    
        // Return the formatted string
        return time.join(":") + " " + suffix;
    }
    
    function logCleaner() {
      var now = new Date();
      var nowMilliseconds = now.getTime();
      var maxAge = 120000;
            
      service.events = _.reject(service.events,(event) => {
        var age = event.milliseconds + maxAge;
        return age < nowMilliseconds;
      });
    }
    
    // Run log cleaner every 60 seconds.
    $interval(() => {
      logCleaner();
    }, 60000);
    
    return service;
  });
})();