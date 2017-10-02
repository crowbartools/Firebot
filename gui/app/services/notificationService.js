(function(){
  
 // This provides methods for notifications
 

 angular
  .module('firebotApp')
  .factory('notificationService', function () {
    var service = {};

    /*
    example notification:
    {
      type: "external",
      id: "",
      title: "Some Title",
      message: "some text",
      read: false,
      timestamp: DateTime
    }

    */
    
    var notifications = [];

    service.loadExternalNotifications = function() {

    }

    service.addNotification = function(notification) {

    }

    
    return service;
  });
})();