(function(){
  
 //This a wrapped dropdown element that automatically handles the particulars
 
 angular
   .module('firebotApp')
   .component("notificationCenter", {
       bindings: {},
       template: `
       <div class="notifications-wrapper">
          <i class="far fa-bell"></i>
          <div ng-if="$ctrl.unreadCount() > 0" class="notification-badge">{{$ctrl.unreadCount()}}</div>
       </div>
       `,
       controller: function($scope, $element, $attrs, notificationService) {
         var ctrl = this;
         
         ctrl.unreadCount = notificationService.getUnreadCount;
       }   
     });     
 })();