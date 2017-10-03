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

    service.loadExternalNotifications = function() {
      $http.get("https://raw.githubusercontent.com/Firebottle/Firebot/dev/resources/notifications.json").then((response) => {
        var externalNotifications = response.data;

        var knownExtNotis = getKnownExternalNotifications();

        var newKnownExtNotis = [];

        externalNotifications.forEach((n) => {

          var previouslyKnownNoti = findKnownExternalNoti(n.id, knownExtNotis);
          newKnownExtNotis.push({id: n.id, deleted: previouslyKnownNoti.deleted == true});

          if(previouslyKnownNoti == null) {
                       
            service.addNotification({
                type: NotificationType.EXTERNAL,
                icon: n.icon ? n.icon : NotificationIconType.INFO,
                title: n.title,
                message: n.message
              }, 
              true);

          }
        });

        setKnownExternalNotifications(newKnownExtNotis);
      });
    }

    service.loadSavedNotifications = function() {
      notifications = getSavedNotifications();
    }

    service.addNotification = function(notification, permenantlySave = false) {
      notification.uuid = uuid();
      notification.timestamp = new Date();
      notification.read = false;
      notifications.push(notification);
    }

    service.markNotificationAsRead = function(notification) {


    }

    /* Helpers */

    function getNotificationsFile() {
      return dataAccess.getJsonDbInUserData("/user-settings/notifications");
    }

    function getSavedNotifications() {
      var savedNotis = getNotificationsFile().getData("/savedNotifications")
      return savedNotis ? savedNotis : [];
    }

    function setSavedNotifications(notis) {
      getNotificationsFile().push("/savedNotifications", notis);
    }

    function getKnownExternalNotifications() {
      var externalNotiIds = getNotificationsFile().getData("/knownExternalNotifications")
      return externalNotiIds ? externalNotiIds : [];
    }

    function setKnownExternalNotifications(notis) {
      getNotificationsFile().push("/knownExternalNotifications", notis);
    }

    function findKnownExternalNoti(id, knownExternalNotis) {
      var known = knownExternalNotis.filter((n) => n.id == id);
      return known;
    }

    function uuid() {
      return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
      )
    }
    
    return service;
  });
})();