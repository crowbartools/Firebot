(function(){
  
 // This provides methods for notifications
 

 angular
  .module('firebotApp')
  .factory('notificationService', function ($http) {
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
      $http.get("github.com").then((response) => {

      });
    }

    service.loadSavedNotifications = function() {
      
    }

    service.addNotification = function(notification, permenantlySave = false) {

    }

    
    return service;
  });
})();