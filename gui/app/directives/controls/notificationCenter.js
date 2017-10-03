(function(){
  
 //This a wrapped dropdown element that automatically handles the particulars

 //popover-placement="'bottom'" popover-trigger="'outsideClick'"
 
 angular
   .module('firebotApp')
   .component("notificationCenter", {
       bindings: {},
       template: `
       <div class="notifications-wrapper">
          <div uib-popover-template="$ctrl.templateUrl" popover-placement="bottom" popover-trigger="'outsideClick'" popover-append-to-body="true">
            <i class="far fa-bell" style="cursor:pointer;"></i>
          </div>
          <div ng-if="$ctrl.unreadCount() > 0" class="notification-badge noselect animated bounceIn">{{$ctrl.unreadCount()}}</div>
       </div>
       <script type="text/ng-template" id="notificationCenterPopupTemplate.html">
          <div>Notifications</div>
          <div ng-repeat="notification in $ctrl.getNotifications() track by notification.uuid">
            {{notification.title}}
          </div>
        </script>
       `,
       controller: function($scope, $element, $attrs, notificationService) {
         var ctrl = this;
         
         ctrl.unreadCount = notificationService.getUnreadCount;
         ctrl.getNotifications = notificationService.getNotifications;

         ctrl.templateUrl = "notificationCenterPopupTemplate.html"
       }   
     });     
 })();