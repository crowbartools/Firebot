(function(){
  
 // This provides methods for notifications
 
 const dataAccess = require('../../lib/common/data-access.js');

 angular
  .module('firebotApp')
  .factory('notificationService', function ($http) {

    var service = {};

    const NotificationType = {
      EXTERNAL: "external",
      UPDATE: "update",
      MISC: "misc"
    }

    const NotificationIconType = {
      UPDATE: "update",
      INFO: "info",
      TIP: "tip",
      WARNING: "warning"
    }


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

    service.getNotifications = function() {
      return notifications;
    }

    service.getUnreadCount = function() {
      return notifications.filter((n) => !n.read).length;
    }

    service.addNotification = function(notification, permenantlySave = false) {
      notification.uuid = uuid();
      notification.timestamp = new Date();
      notification.read = false;

      notification.type = notification.type ? notification.type : NotificationType.MISC;
      notification.icon = notification.icon ? notification.icon : NotificationIconType.INFO,

      notifications.push(notification);
      if(permenantlySave) {
        pushSavedNotification(notification);
      }
    }

    service.loadAllNotifications = function() {
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
                icon: n.icon ? n.icon : NotificationIconType.INFO,
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
      var saveNotis = getDataFromFile("/savedNotifications")
      return saveNotis ? saveNotis : [];
    }

    function setSavedNotifications(notis) {
      pushDataToFile("/savedNotifications", notis);
    }

    function pushSavedNotification(notification) {
      pushDataToFile("/savedNotifications[]", notification, true);
    }

    function updateSavedNotificationAtIndex(notification, index) {
      pushDataToFile(`/savedNotifications[${index}]`, notification, true);
    }

    function deleteSavedNotificationAtIndex(index) {
      deleteDataFromFile(`/savedNotifications[${index}]`);
    }

    function getKnownExternalNotifications() {
      var externalNotiIds = getDataFromFile("/knownExternalNotifications")
      return externalNotiIds ? externalNotiIds : [];
    }

    function setKnownExternalNotifications(notis) {
      pushDataToFile("/knownExternalNotifications", notis);
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