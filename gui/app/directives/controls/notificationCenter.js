(function(){
  
 //This a wrapped dropdown element that automatically handles the particulars

 //popover-placement="'bottom'" popover-trigger="'outsideClick'"
 
 angular
   .module('firebotApp')
   .component("notificationCenter", {
       bindings: {},
       template: `
       <div class="notifications-wrapper">
          <div uib-popover-template="$ctrl.templateUrl" popover-placement="bottom-right" popover-trigger="'outsideClick'" popover-append-to-body="true" popover-class="notification-popover">
            <i class="far fa-bell" style="cursor:pointer;"></i>
          </div>
          <div ng-if="$ctrl.unreadCount() > 0" class="notification-badge noselect animated bounceIn">{{$ctrl.unreadCount() > 9 ? '+' : $ctrl.unreadCount()}}</div>
       </div>

       <script type="text/ng-template" id="notificationCenterPopupTemplate.html">
          <div class="notification-popover-header">
            <span>Notifications</span>
          </div>
          <div class="noti-preview-wrapper">
            <div ng-repeat="notification in $ctrl.getNotifications() | orderBy: 'created_at':true track by notification.uuid" class="notification-card" ng-click="$ctrl.openNotification(notification, $index)">
              <span class="noti-unread-indicator" ng-class="{'read': notification.read}"></span>
              <span class="noti-icon">
                <i class="fal fa-info-circle"></i>
              </span>
              <span class="noti-text">{{notification.title}}</span>
              <div class="noti-action" uib-dropdown uib-dropdown-toggle ng-click="$event.stopPropagation();" dropdown-append-to-body="true">
                <span class="noselect pointer"><i class="fal fa-ellipsis-v"></i></span>
                <ul class="dropdown-menu" uib-dropdown-menu>
                  <li><a href ng-click="deleteNotification(notification, $index)" style="color:red;"><i class="far fa-trash-alt"></i> Delete notification</a></li>
                </ul>
              </div>             
            </div>
          </div>        
        </script>

        <script type="text/ng-template" id="notificationModal.html">
          <div class="modal-header">
            <h4 class="modal-title" style="text-align: center">{{notification.title}}</h4>
          </div>
          <div class="modal-body" style="text-align:center; padding-top:15px">
            <dynamic-element message='notification.message'></dynamic-element>
          </div>
          <div class="modal-footer" style="text-align:center;position: relative;">
            
             
            <button class="btn btn-primary" type="button" ng-click="ok()">OK</button>
          </div>
        </script>
       `,
      controller: function($scope, $element, $attrs, notificationService, utilityService) {
        var ctrl = this;
        
        ctrl.unreadCount = notificationService.getUnreadCount;
        ctrl.getNotifications = notificationService.getNotifications;

        ctrl.templateUrl = "notificationCenterPopupTemplate.html";

        $scope.deleteNotification = notificationService.deleteNotification;
        
        ctrl.openNotification = function(notification, index) {
          notificationService.markNotificationAsRead(notification, index);
          var justUpdatedModalContext = {
            templateUrl: "notificationModal.html",
            size: 'sm',
            resolveObj: {
              notification: () => notification,
              index: () => index
            },
            controllerFunc: ($scope, $uibModalInstance, $compile, $sce, notificationService, notification, index) => {
              
              $scope.notification = notification;
              
              var compiledHtml = $compile(notification.message)($scope);

              $scope.htmlNotificationMessage = $sce.trustAsHtml(compiledHtml.html());
    
              $scope.ok = function() {
                $uibModalInstance.dismiss('cancel');
              };
            }
          }
          utilityService.showModal(justUpdatedModalContext);
        }
       }   
     })
     .directive('dynamicElement', ['$compile', function ($compile) {
          return { 
            restrict: 'E', 
            scope: {
                message: "="
            },
            replace: true,
            link: function(scope, element, attrs) {
                var template = $compile(scope.message)(scope);
                element.replaceWith(template);               
            },
            controller: ['$scope', '$rootScope', function($scope, $rootScope) {
              $scope.rootScope = $rootScope;
            }]
          }
      }]);     
 })();