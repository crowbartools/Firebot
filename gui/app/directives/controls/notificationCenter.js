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
            <i class="far fa-bell clickable" style="cursor:pointer;"></i>
          </div>
          <div ng-if="$ctrl.unreadCount() > 0" class="notification-badge noselect animated bounceIn">{{$ctrl.unreadCount() > 9 ? '+' : $ctrl.unreadCount()}}</div>
       </div>

       <script type="text/ng-template" id="notificationCenterPopupTemplate.html">
          <div class="notification-popover-header">
            <span>Notifications</span>
          </div>
          <div class="noti-preview-wrapper">
            <div ng-repeat="notification in $ctrl.getNotifications() | orderBy: 'created_at':true track by $index" class="notification-card" ng-click="$ctrl.openNotification(notification)">
              <span class="noti-unread-indicator" ng-class="{'read': notification.read}"></span>
              <span class="noti-icon">
                <i class="fal" ng-class="getIconClass(notification.icon)"></i>
              </span>
              <div class="noti-title-wrapper">
                <span class="noti-icon-text">{{getIconTypeText(notification.icon)}}</span>
                <span class="noti-text">{{notification.title}}</span>
              </div>
              <div class="noti-action" uib-dropdown uib-dropdown-toggle ng-click="$event.stopPropagation();" dropdown-append-to-body="true">
                <span class="noselect pointer"><i class="fal fa-ellipsis-v"></i></span>
                <ul class="dropdown-menu" uib-dropdown-menu>
                  <li><a href ng-click="deleteNotification(notification)" style="color:red;"><i class="far fa-trash-alt"></i> Delete notification</a></li>
                </ul>
              </div>             
            </div>
            <div ng-if="$ctrl.getNotifications().length < 1" class="no-notifications-card">
              <span class="muted">No notifications.</span>
            </div>
          </div>        
        </script>

        <script type="text/ng-template" id="notificationModal.html">
          <div class="modal-header">
            <h4 class="modal-title" style="text-align: center">{{notification.title}}</h4>
          </div>
          <div class="modal-body" style="text-align:center; padding-top:15px">
            <dynamic-element message="notification.message"></dynamic-element>
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

        $scope.getIconTypeText = function(iconType) {
          var NotificationIconType = notificationService.NotificationIconType;
          switch(iconType) {
            case NotificationIconType.UPDATE:
              return "UPDATE";
            case NotificationIconType.ALERT:
              return "ALERT";
            case NotificationIconType.TIP:
              return "TIP";
            case NotificationIconType.INFO:
            default:
              return "INFO"
          }
        }

        $scope.getIconClass = function(iconType) {
          var NotificationIconType = notificationService.NotificationIconType;
          var iconClass = "";
          switch(iconType) {
            case NotificationIconType.UPDATE:
              iconClass = "download";
              break;
            case NotificationIconType.ALERT:
              iconClass = "exclamation-circle";
              break;
            case NotificationIconType.TIP:
              iconClass = "question-circle";
              break;
            case NotificationIconType.INFO:
            default:
              iconClass = "info-circle"
          }
          return `fa-${iconClass}`
        }
        
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
                var htmlWrap = `<div style="width:100%; height: 100%; position: relative;">${scope.message}</div>`.trim();
                
                var el = angular.element(htmlWrap);
                var template = $compile(el)(scope);
                element.replaceWith(template);               
            },
            controller: ['$scope', '$rootScope', function($scope, $rootScope) {
              $scope.rootScope = $rootScope;
            }]
          }
      }]);     
 })();