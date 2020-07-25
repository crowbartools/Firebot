"use strict";
(function() {
    //This a wrapped dropdown element that automatically handles the particulars

    angular
        .module("firebotApp")
        .component("notificationCenter", {
            bindings: {},
            template: `
       <div class="notifications-wrapper">
          <div aria-label="Notification Center" uib-popover-template="$ctrl.templateUrl" popover-placement="bottom-right" popover-trigger="'outsideClick'" popover-append-to-body="true" popover-class="notification-popover">
            <i class="far fa-bell clickable noti-bell-icon" style="cursor:pointer;"></i>
          </div>
          <div ng-if="$ctrl.unreadCount() > 0 || $ctrl.notiService.mixerReportingIssues" class="notification-badge noselect animated bounceIn" ng-class="{ 'mixer-issue': $ctrl.notiService.mixerReportingIssues }">{{getBadgeText()}}</div>
       </div>

       <script type="text/ng-template" id="notificationCenterPopupTemplate.html">
          
          <div class="notification-popover-header">
            <span>Notifications</span>
          </div>
          <div class="noti-preview-wrapper">
            <div ng-repeat="notification in $ctrl.getNotifications() | orderBy: 'created_at':true track by $index" class="notification-card" ng-click="$ctrl.openNotification(notification)" aria-label="Notification: {{notification.title}}">
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

        <script type="text/ng-template" id="mixerStatusModal.html">
          <div class="modal-header">
            <h4 class="modal-title" style="text-align: center">Mixer Status</h4>
          </div>
          <div class="modal-body" style="text-align: center;">
            <h3 style="font-size:13px;text-transform:uppercase;opacity:0.7; margin-bottom: 0px;">Current Status</h3>
            <div class="mixer-status-modal-icon" ng-class="{ unhealthy: ns.mixerReportingIssues }">
                <i class="fal" ng-class="ns.getStatusIcon()"></i>
            </div>
            <p>{{ns.mixerStatus.description}}</p>

            <h3 style="font-size:13px;text-transform:uppercase;opacity:0.7;margin-top: 35px;">Ongoing Incident(s)</h3>
            <div ng-repeat="incident in ns.mixerStatus.unresolvedIncidents" style="margin-bottom: 10px;">
                <div style="font-size:16px;"><strong>{{incident.name}}</strong></div>
                <div ng-if="incident.incident_updates && incident.incident_updates.length > 0" style="font-size:13px;margin-top:4px;">
                    <p style="margin-bottom:0;">Update from Mixer: {{incident.incident_updates[0].body}}</p>
                    <div class="muted" style="font-size:11px;">{{getLocaleDateString(incident.incident_updates[0].updated_at)}}</div>                  
                </div>
            </div>
            <p ng-if="ns.mixerStatus.unresolvedIncidents.length < 1">None</p>

            <div style="margin-top: 35px;">
                <span>More info at <a href ng-click="$rootScope.openLinkExternally('https://status.mixer.com')">status.mixer.com</a></span>
            </div>
          </div>
          <div class="modal-footer" style="text-align:center;position: relative;">
            <button class="btn btn-primary" type="button" ng-click="ok()">OK</button>
          </div>
        </script>
       `,
            controller: function(
                $scope,
                $element,
                $attrs,
                notificationService,
                utilityService
            ) {
                let ctrl = this;

                ctrl.notiService = notificationService;

                ctrl.unreadCount = notificationService.getUnreadCount;
                ctrl.getNotifications = notificationService.getNotifications;

                ctrl.templateUrl = "notificationCenterPopupTemplate.html";

                $scope.deleteNotification = notificationService.deleteNotification;

                $scope.getBadgeText = () => {
                    let unreadCount = notificationService.getUnreadCount();

                    if (unreadCount > 9) {
                        return '9+';
                    } else if (unreadCount < 0 || notificationService.mixerReportingIssues) {
                        return "!";
                    }
                    return unreadCount.toString();
                };

                $scope.getIconTypeText = function(iconType) {
                    let NotificationIconType = notificationService.NotificationIconType;
                    switch (iconType) {
                    case NotificationIconType.UPDATE:
                        return "UPDATE";
                    case NotificationIconType.ALERT:
                        return "ALERT";
                    case NotificationIconType.TIP:
                        return "TIP";
                    case NotificationIconType.INFO:
                    default:
                        return "INFO";
                    }
                };

                $scope.getIconClass = function(iconType) {
                    let NotificationIconType = notificationService.NotificationIconType;
                    let iconClass = "";
                    switch (iconType) {
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
                        iconClass = "info-circle";
                    }
                    return `fa-${iconClass}`;
                };

                ctrl.openNotification = function(notification, index) {
                    notificationService.markNotificationAsRead(notification, index);
                    let justUpdatedModalContext = {
                        templateUrl: "notificationModal.html",
                        size: "sm",
                        resolveObj: {
                            notification: () => notification,
                            index: () => index
                        },
                        controllerFunc: (
                            $scope,
                            $uibModalInstance,
                            $compile,
                            $sce,
                            notificationService,
                            notification
                        ) => {
                            $scope.notification = notification;

                            $scope.ok = function() {
                                $uibModalInstance.dismiss("cancel");
                            };
                        }
                    };
                    utilityService.showModal(justUpdatedModalContext);
                };

                ctrl.openStatusModal = function() {
                    let modalContext = {
                        templateUrl: "mixerStatusModal.html",
                        size: 'sm',
                        resolveObj: {},
                        controllerFunc: ($scope, $rootScope, $uibModalInstance, notificationService) => {

                            $scope.ns = notificationService;
                            $scope.$rootScope = $rootScope;

                            $scope.ok = function() {
                                $uibModalInstance.dismiss('cancel');
                            };

                            $scope.getLocaleDateString = (jsonDate) => {
                                return new Date(jsonDate).toLocaleString();
                            };
                        }
                    };
                    utilityService.showModal(modalContext);
                };
            }
        })
        .directive("dynamicElement", [
            "$compile",
            function($compile) {
                return {
                    restrict: "E",
                    scope: {
                        message: "="
                    },
                    replace: true,
                    link: function(scope, element) {
                        let htmlWrap = `<div style="width:100%; height: 100%; position: relative;">${
                            scope.message
                        }</div>`.trim();

                        let el = angular.element(htmlWrap);
                        let template = $compile(el)(scope);
                        element.replaceWith(template);
                    },
                    controller: [
                        "$scope",
                        "$rootScope",
                        function($scope, $rootScope) {
                            $scope.$rootScope = $rootScope;
                        }
                    ]
                };
            }
        ]);
}());
