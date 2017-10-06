(function(){
  
 // This provides methods for notifications
 
 const dataAccess = require('../../lib/common/data-access.js');

 angular
  .module('firebotApp')
  .factory('notificationService', function ($http) {

    var service = {};

    const NotificationType = {
      EXTERNAL: "external",
      INTERNAL: "internal"
    }

    const NotificationIconType = {
      UPDATE: "update",
      INFO: "info",
      TIP: "tip",
      WARNING: "warning"
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
      var index = notifications.indexOf(notification);
      if(notification.saved) {
        updateSavedNotificationAtIndex(notification, index);
      }  
    }

    service.deleteNotification = function(notification) {
      var index = notifications.indexOf(notification);
      notifications = notifications.filter(n => n.uuid !== notification.uuid);
      if(notification.saved) {
        deleteSavedNotificationAtIndex(index);
      }
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
      $http.get("https://raw.githubusercontent.com/Firebottle/Firebot/dev/resources/notifications.json").then((response) => {
        var externalNotifications = response.data;

        var knownExtNotis = getKnownExternalNotifications();

        var newKnownExtNotis = [];

        externalNotifications.forEach((n) => {

          newKnownExtNotis.push(n.id);

          if(!knownExtNotis.includes(n.id)) {
                       
            service.addNotification({
                type: NotificationType.EXTERNAL,
                title: n.title,
                message: n.message,
                externalId: n.id
              }, 
              true);

          }
        });

        setKnownExternalNotifications(newKnownExtNotis);
      });
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
      pushDataToFile("/notifications[]", notification, true);
    }

    function updateSavedNotificationAtIndex(notification, index) {
      pushDataToFile(`/notifications[${index}]`, notification, true);
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
        getNotificationsFile().push(path, data);
      } catch(err){};
    }
    
    function getDataFromFile(path) {
      var data = null;
      try{
        data = getNotificationsFile().getData(path);      
      } catch(err){};
      return data;
    }

    function deleteDataFromFile(path) {
      try{
        getNotificationsFile().delete(path);      
      } catch(err){};
    }

    function uuid() {
      return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
      )
    }
    
    return service;
  });
})();