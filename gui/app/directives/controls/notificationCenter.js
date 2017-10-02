(function(){
  
 //This a wrapped dropdown element that automatically handles the particulars
 
 angular
   .module('firebotApp')
   .component("notificationCenter", {
       bindings: {},
       template: `
       <div class="notifications-wrapper">
          <i class="far fa-bell"></i>
          <div class="notification-badge">1</div>
       </div>
       `,
       controller: function($scope, $element, $attrs) {
         var ctrl = this;
         
         
       }   
     });     
 })();