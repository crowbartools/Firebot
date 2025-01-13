"use strict";
(function() {

    const { marked } = require("marked");
    const { sanitize } = require("dompurify");

    angular
        .module("firebotApp")
        .component("notificationCenter", {
            bindings: {},
            template: `
       <div class="notifications-wrapper">
          <div aria-label="Notification Center" uib-popover-template="$ctrl.templateUrl" popover-placement="bottom-right" popover-trigger="'outsideClick'" popover-append-to-body="true" popover-class="notification-popover">
            <i class="far fa-bell clickable noti-bell-icon" style="cursor:pointer;"></i>
          </div>
          <div ng-if="$ctrl.unreadCount() > 0" class="notification-badge noselect animated bounceIn">{{getBadgeText()}}</div>
       </div>

       <script type="text/ng-template" id="notificationCenterPopupTemplate.html">

          <div class="notification-popover-header">
            <span>Notifications</span>
          </div>
          <div class="noti-preview-wrapper">
            <div ng-repeat="notification in $ctrl.getNotifications() | orderBy: 'created_at':true track by $index" class="notification-card" ng-click="$ctrl.openNotification(notification)" aria-label="Notification: {{notification.title}}">
              <span class="noti-unread-indicator" ng-class="{'read': notification.read}"></span>
              <span class="noti-icon">
                <i class="fal" ng-class="getIconClass(notification.type)"></i>
              </span>
              <div class="noti-title-wrapper">
                <span class="noti-icon-text">{{getIconTypeText(notification.type)}}</span>
                <span class="noti-text">{{notification.title}}</span>
              </div>
              <div class="noti-action" uib-dropdown uib-dropdown-toggle ng-click="$event.stopPropagation();" dropdown-append-to-body="true">
                <span class="noselect pointer"><i class="fal fa-ellipsis-v"></i></span>
                <ul class="dropdown-menu" uib-dropdown-menu>
                  <li><a href ng-click="deleteNotification(notification.id)" style="color:red;"><i class="far fa-trash-alt"></i> Delete notification</a></li>
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
          <div class="modal-body">
            <div style="display: flex;">
              <div class="modal-icon"><i class="fad" ng-class="iconClass" aria-hidden="true"></i></div>
              <dynamic-element ng-if="notification.source !== 'script'" message="message"></dynamic-element>
              <div
                ng-if="notification.source === 'script'"
                style="width:100%; height: 100%; position: relative;"
                ng-bind-html="message"
              >
              </div>
            </div>
          </div>
          <div class="modal-footer" style="text-align:center;">
            <button
                ng-if="showOpenScriptsFolderButton"
                class="btn btn-default mr-5 pull-left"
                type="button"
                ng-click="openScriptsFolder()"
            >Open Scripts Folder</button>
            <button
                class="btn btn-primary"
                ng-class="{'pull-right': showOpenScriptsFolderButton}"
                style="min-width: 75px;"
                type="button"
                ng-click="ok()"
            >OK</button>
          </div>
        </script>
       `,
            controller: function(
                $scope,
                notificationService,
                utilityService
            ) {
                const ctrl = this;

                ctrl.notiService = notificationService;

                ctrl.unreadCount = notificationService.getUnreadCount;
                ctrl.getNotifications = notificationService.getNotifications;

                ctrl.templateUrl = "notificationCenterPopupTemplate.html";

                $scope.deleteNotification = notificationService.deleteNotification;

                $scope.getBadgeText = () => {
                    const unreadCount = notificationService.getUnreadCount();

                    if (unreadCount > 9) {
                        return '9+';
                    } else if (unreadCount < 0) {
                        return "!";
                    }
                    return unreadCount.toString();
                };

                $scope.getIconTypeText = function(type) {
                    const NotificationType = notificationService.NotificationType;
                    switch (type) {
                        case NotificationType.UPDATE:
                            return "UPDATE";
                        case NotificationType.ALERT:
                            return "ALERT";
                        case NotificationType.TIP:
                            return "TIP";
                        case NotificationType.INFO:
                        default:
                            return "INFO";
                    }
                };

                $scope.getIconClass = notificationService.getIconClass;

                ctrl.openNotification = (notification, index) => {
                    notificationService.markNotificationAsRead(notification.id);
                    const notificationModal = {
                        templateUrl: "notificationModal.html",
                        size: "sm",
                        resolveObj: {
                            notification: () => notification,
                            index: () => index,
                            iconClass: () => notificationService.getIconClass(notification.type)
                        },
                        controllerFunc: (
                            $scope,
                            $uibModalInstance,
                            $sce,
                            backendCommunicator,
                            notification,
                            iconClass
                        ) => {
                            $scope.message = notification.message;
                            if ($scope.message) {
                                if (notification.source === "script") {
                                    $scope.message = $sce.trustAsHtml(
                                        sanitize(marked($scope.message))
                                    );
                                } else {
                                    $scope.message = $sce.trustAsHtml(
                                        marked($scope.message)
                                    );
                                }
                            }

                            $scope.notification = notification;
                            $scope.iconClass = iconClass;

                            $scope.showOpenScriptsFolderButton = notification.source === "script" && notification.type === "update";
                            $scope.openScriptsFolder = () => {
                                backendCommunicator.fireEvent("openScriptsFolder");
                            };

                            $scope.ok = function() {
                                $uibModalInstance.dismiss("cancel");
                            };
                        }
                    };
                    utilityService.showModal(notificationModal);
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
                        const htmlWrap = `<div style="width:100%; height: 100%; position: relative;">${
                            scope.message
                        }</div>`.trim();

                        const el = angular.element(htmlWrap);
                        const template = $compile(el)(scope);
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
