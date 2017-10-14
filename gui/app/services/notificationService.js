(function(){
  
 // This provides methods for notifications
 
 const dataAccess = require('../../lib/common/data-access.js');

 angular
  .module('firebotApp')
  .factory('notificationService', function ($http, $interval) {

    var service = {};

    const NotificationType = {
      EXTERNAL: "external",
      INTERNAL: "internal"
    }

    const NotificationIconType = {
      UPDATE: "update",
      INFO: "info",
      TIP: "tip",
      ALERT: "alert"
    }

    service.NotificationIconType = NotificationIconType;
    service.NotificationType = NotificationType;
    
    var notifications = [];

    service.getNotifications = function() {
      return notifications;
    }

    service.getUnreadCount = function() {
      return notifications.filter((n) => !n.read).length;
    }

    service.markNotificationAsRead = function(notification) {
      notification.read = true;
  
      if(notification.saved) {
        var index = getIndexOfUuid(notification.uuid);
        if(index != null) {
          updateSavedNotificationAtIndex(notification, index);
        }       
      }  
    }

    service.deleteNotification = function(notification) {

      if(notification.saved) {
        var index = getIndexOfUuid(notification.uuid);
        if(index != null) {
          deleteSavedNotificationAtIndex(index);
        }       
      } 
      
      notifications = notifications.filter(n => n.uuid !== notification.uuid);
    }

    service.addNotification = function(notification, permenantlySave = false) {
      notification.uuid = uuid();
      notification.timestamp = new Date();
      notification.read = false;

      notification.type = notification.type ? notification.type : NotificationType.INTERNAL;
      notification.icon = notification.icon ? notification.icon : NotificationIconType.INFO;
      
      if(permenantlySave) {
        notification.saved = true;
        pushSavedNotification(notification);
      }

      notifications.push(notification);
    }

    service.loadAllNotifications = function() {
      notifications = [];
      loadSavedNotifications();
      loadExternalNotifications();
    }

    function loadSavedNotifications() {
      notifications = getSavedNotifications();
    }

    function loadExternalNotifications() {
      $http.get("https://raw.githubusercontent.com/Firebottle/Firebot/master/resources/notifications.json").then((response) => {
        var externalNotifications = response.data;

        var knownExtNotis = getKnownExternalNotifications();

        var newKnownExtNotis = [];

        externalNotifications.forEach((n) => {

          newKnownExtNotis.push(n.id);

          if(!knownExtNotis.includes(n.id)) {

            n.type = NotificationType.EXTERNAL;
            n.externalId = n.id;
            n.id = undefined;
                       
            service.addNotification(n, true);

          }
        });

        setKnownExternalNotifications(newKnownExtNotis);
      });
    }

    var externalIntervalCheck = null;
    service.startExternalIntervalCheck = function() {
      //check for new external notifications every 5 minutes
      if(externalIntervalCheck != null) {
        $interval.cancel(externalIntervalCheck);
      }

      externalIntervalCheck = $interval(()=> {
        service.loadExternalNotifications();
      }, 5*60000)
    }

    /* Helpers */

    function getSavedNotifications() {
      var saveNotis = getDataFromFile("/notifications")
      return saveNotis ? saveNotis : [];
    }

    function setSavedNotifications(notis) {
      pushDataToFile("/notifications", notis);
    }

    function pushSavedNotification(notification) {
      pushDataToFile("/notifications[]", notification);
    }

    function updateSavedNotificationAtIndex(notification, index) {
      pushDataToFile(`/notifications[${index}]`, notification);
    }

    function deleteSavedNotificationAtIndex(index) {
      deleteDataFromFile(`/notifications[${index}]`);
    }

    function getKnownExternalNotifications() {
      var externalNotiIds = getDataFromFile("/knownExternalIds")
      return externalNotiIds ? externalNotiIds : [];
    }

    function setKnownExternalNotifications(notis) {
      pushDataToFile("/knownExternalIds", notis);
    }

    function getNotificationsFile() {
      return dataAccess.getJsonDbInUserData("/user-settings/notifications");
    }

    function pushDataToFile(path, data) {
      try {
        getNotificationsFile().push(path, data, true);
      } catch(err){};
    }
    
    function getDataFromFile(path) {
      var data = null;
      try{
        data = getNotificationsFile().getData(path, true);      
      } catch(err){};
      return data;
    }

    function deleteDataFromFile(path) {
      try{
        getNotificationsFile().delete(path);      
      } catch(err){};
    }

    function getIndexOfUuid(uuid) {
      var foundIndex = null;

      for(var i = 0; i < notifications.length; i++) {
        var n = notifications[i];
        if(n.uuid == uuid) {
          foundIndex = i;
          break;
        }
      }

      return foundIndex;
    }

    function uuid() {
      return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
      )
    }
    
    return service;
  });
})();