(function(){
  
 // This provides methods for notifications
 
 const dataAccess = require('../../lib/common/data-access.js');

 angular
  .module('firebotApp')
  .factory('notificationService', function ($http) {

    function getNotificationsFile() {
      return dataAccess.getJsonDbInUserData("/user-settings/notifications");
    }

    var service = {};

    /*
    example notification:
    {
      type: "external",
      uuid: "",
      title: "Some Title",
      message: "some text",
      read: false,
      timestamp: DateTime
    }

    */
    
    var notifications = [];




    service.loadExternalNotifications = function() {
      $http.get("https://raw.githubusercontent.com/Firebottle/Firebot/dev/resources/notifications.json").then((response) => {


        console.log(response.data);
      });
    }

    service.loadSavedNotifications = function() {
      
    }

    service.addNotification = function(notification, permenantlySave = false) {

    }

    
    return service;
  });
})();