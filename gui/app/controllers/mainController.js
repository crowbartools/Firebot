'use strict';
(function() {

    const electron = require('electron');
    const shell = electron.shell;

    let app = angular
        .module('firebotApp',
            ['ngAnimate', 'ngRoute', 'ui.bootstrap', 'rzModule', 'ui.select', 'ngSanitize', 'ui.select', 'ui.sortable', 'luegg.directives']);

    app.run(
        function initializeApplication(chatMessagesService) { // eslint-disable-line no-unused-vars
            // This does nothing but require the injected services to be
            // instantiated on app start
        }
    );

    app.controller('MainController', function($scope, $rootScope, $timeout, boardService,
        connectionService, groupsService, utilityService, settingsService, updatesService,
        eventLogService, websocketService, notificationService) {

        $rootScope.showSpinner = true;

        $scope.currentTab = "Interactive";

        $scope.navExpanded = true;

        $scope.toggleNav = function() {
            $scope.navExpanded = !$scope.navExpanded;
        };

        $scope.setTab = function(tabId) {
            $scope.currentTab = tabId.toLowerCase();
            $timeout(function () {
                $scope.$broadcast('rzSliderForceRender');
            });
            $timeout(function () {
                $scope.$broadcast('rzSliderForceRender');
            }, 50);
        };

        $scope.tabIsSelected = function(tabId) {
            return $scope.currentTab.toLowerCase() === tabId.toLowerCase();
        };

        $scope.currentTabIsFullScreen = function() {
            return $scope.currentTab === 'chat feed';
        };

        $timeout(() => {
            notificationService.loadAllNotifications();
            notificationService.startExternalIntervalCheck();
        }, 1000);

        /**
      * rootScope functions. This means they are accessable in all scopes in the front end
      * This is probably bad form, so putting functions in rootScope shouldnt be abused too much
      */
        $rootScope.pasteClipboard = function(elementId, shouldUnfocus) {
            angular.element(`#${elementId}`).focus();
            document.execCommand('paste');
            if (shouldUnfocus === true || shouldUnfocus == null) {
                angular.element(`#${elementId}`).blur();
            }
        };

        $rootScope.copyTextToClipboard = function(text) {
            let textArea = document.createElement("textarea");
            // Place in top-left corner of screen regardless of scroll position.
            textArea.style.position = 'fixed';
            textArea.style.top = 0;
            textArea.style.left = 0;

            // Ensure it has a small width and height. Setting to 1px / 1em
            // doesn't work as this gives a negative w/h on some browsers.
            textArea.style.width = '2em';
            textArea.style.height = '2em';

            // We don't need padding, reducing the size if it does flash render.
            textArea.style.padding = 0;

            // Clean up any borders.
            textArea.style.border = 'none';
            textArea.style.outline = 'none';
            textArea.style.boxShadow = 'none';

            // Avoid flash of white box if rendered for any reason.
            textArea.style.background = 'transparent';


            textArea.value = text;

            document.body.appendChild(textArea);

            textArea.select();

            try {
                let successful = document.execCommand('copy');
                let msg = successful ? 'successful' : 'unsuccessful';
                console.log('Copying text command was ' + msg);
            } catch (err) {
                console.log('Oops, unable to copy');
            }

            document.body.removeChild(textArea);
        };

        $rootScope.openLinkExternally = function(url) {
            shell.openExternal(url);
        };

        /*
      * MANAGE LOGINS MODAL
      */
        $scope.showManageLoginsModal = function() {
            let showManageLoginsModal = {
                templateUrl: "manageLoginsModal.html",
                // This is the controller to be used for the modal.
                controllerFunc: ($scope, $uibModalInstance, connectionService) => {
                    $scope.accounts = connectionService.accounts;

                    // Login Kickoff
                    $scope.loginOrLogout = function(type) {
                        connectionService.loginOrLogout(type);
                    };

                    // When the user clicks "Save", we want to pass the id back to interactiveController
                    $scope.close = function() {
                        $uibModalInstance.close();
                    };

                    // When they hit cancel or click outside the modal, we dont want to do anything
                    $scope.dismiss = function() {
                        $uibModalInstance.dismiss('cancel');
                    };
                }
            };
            utilityService.showModal(showManageLoginsModal);
        };

        /*
      * ABOUT FIREBOT MODAL
      */
        $scope.showAboutFirebotModal = function() {
            let addBoardModalContext = {
                templateUrl: "aboutFirebotModal.html",
                // This is the controller to be used for the modal.
                controllerFunc: ($scope, $uibModalInstance) => {
                    // The model for the board id text field
                    $scope.version = electron.remote.app.getVersion();

                    // When the user clicks "Save", we want to pass the id back to interactiveController
                    $scope.close = function() {
                        $uibModalInstance.close();
                    };

                    // When they hit cancel or click outside the modal, we dont want to do anything
                    $scope.dismiss = function() {
                        $uibModalInstance.dismiss('cancel');
                    };
                },
                size: 'sm'
            };
            utilityService.showModal(addBoardModalContext);
        };

        $scope.showConnectionPanelModal = function() {
            utilityService.showModal({
                component: "connectionPanelModal",
                windowClass: "connection-panel-modal"
            });
        };

        /**
      * Initial App Load
      */
        /**
      * Login preview stuff
      */
        $scope.accounts = connectionService.accounts;

        // Run loadLogin to update the UI on page load.
        connectionService.loadLogin();

        if (settingsService.hasJustUpdated()) {
            utilityService.showUpdatedModal();
            settingsService.setJustUpdated(false);
        } else if (settingsService.isFirstTimeUse()) {
            utilityService.showSetupWizard();
            settingsService.setFirstTimeUse(false);
        }


        /**
      * Connection stuff
      */
        $scope.connService = connectionService;

        $scope.connectedServiceCount = function() {
            let services = settingsService.getSidebarControlledServices();

            let count = 0;

            services.forEach((s) => {
                switch (s) {
                case 'interactive':
                    if (connectionService.connectedToInteractive) {
                        count++;
                    }
                    break;
                case 'chat':
                    if (connectionService.connectedToChat) {
                        count++;
                    }
                    break;
                }
            });

            return count;
        };

        $scope.partialServicesConnected = function() {
            let services = settingsService.getSidebarControlledServices();
            let connectedCount = $scope.connectedServiceCount();

            return (services.length > connectedCount);
        };

        $scope.allServicesConnected = function() {
            let services = settingsService.getSidebarControlledServices();
            let connectedCount = $scope.connectedServiceCount();

            return (services.length === connectedCount);
        };

        $scope.waitingForServicesStatusChange = function() {
            return (connectionService.waitingForStatusChange || connectionService.waitingForChatStatusChange);
        };

        $scope.toggleSidebarControlledServices = function() {
            let services = settingsService.getSidebarControlledServices();

            // we only want to connect if none of the connections are currently connected
            // otherwise we will attempt to disconnect everything.

            let shouldConnect = $scope.connectedServiceCount() === 0;
            console.log(services);
            services.forEach((s) => {
                switch (s) {
                case 'interactive': {
                    if (shouldConnect) {
                        console.log("connecting to interactive");
                        connectionService.connectToInteractive();
                    } else if (connectionService.connectedToInteractive) {
                        connectionService.disconnectFromInteractive();
                    }
                    break;
                }
                case 'chat':
                    if (shouldConnect) {
                        console.log("connecting to chat");
                        //connectionService.connectToChat();
                    } else if (connectionService.connectedToChat) {
                        //connectionService.disconnectFromChat();
                    }
                    break;
                }
            });
        };

        // Interactive
        $scope.getConnectionMessage = function() {
            let message = "";
            if (connectionService.waitingForStatusChange) {
                message = connectionService.connectedToInteractive ? 'Disconnecting...' : 'Connecting...';
            } else {
                message = connectionService.connectedToInteractive ? 'Connected' : 'Disconnected';
            }
            return message;
        };
        // Chat
        $scope.getChatConnectionMessage = function() {
            let message = "";
            if (connectionService.waitingForChatStatusChange) {
                message = connectionService.connectedToChat ? 'Disconnecting...' : 'Connecting...';
            } else {
                message = connectionService.connectedToChat ? 'Connected' : 'Disconnected';
            }
            return message;
        };

        // Get app version and change titlebar.
        let appVersion = electron.remote.app.getVersion();
        let version = appVersion;
        $scope.appTitle = 'Firebot Interactive || v' + version + ' || @FirebotApp';

        //Attempt to load viewer groups into memory
        groupsService.loadViewerGroups();

        //check for updates
        // Get update information if we havent alreday
        if (!updatesService.hasCheckedForUpdates) {
            updatesService.checkForUpdate().then((updateData) => {
                $scope.updateIsAvailable = updateData.updateIsAvailable;
            });
        }

        //make sure sliders render properly
        $timeout(function () {
            $scope.$broadcast('rzSliderForceRender');
        }, 250);

        // Apply Theme
        $scope.appTheme = function() {
            return settingsService.getTheme();
        };

        $rootScope.showSpinner = false;

        /*hotkeyService.startHotkeyCapture((keys) => {
            let display = [];
            keys.forEach((k) => {
                display.push(k.displayName);
            });
            console.log(display.join(" + "));
        });*/
    });

    app.config(['$routeProvider', '$locationProvider', function($routeProvider) {
        $routeProvider

        // route for the interactive tab
            .when('/', {
                templateUrl: './templates/interactive/_interactive.html',
                controller: 'interactiveController'
            })

        // route for the viewer groups page
            .when('/groups', {
                templateUrl: './templates/_viewergroups.html',
                controller: 'groupsController'
            })

        // route for the commands page
            .when('/commands', {
                templateUrl: './templates/chat/_commands.html',
                controller: 'commandsController'
            })

        // route for the chat messages page
            .when('/chat-messages', {
                templateUrl: './templates/chat/_chat-messages.html',
                controller: 'chatMessagesController'
            })

        // route for the moderation page
            .when('/moderation', {
                templateUrl: './templates/_moderation.html',
                controller: 'moderationController'
            })

        // route for the settings page
            .when('/settings', {
                templateUrl: './templates/_settings.html',
                controller: 'settingsController'
            })

        // route for the updates page
            .when('/updates', {
                templateUrl: './templates/_updates.html',
                controller: 'updatesController'
            })

        // route for the events page
            .when('/events', {
                templateUrl: './templates/live-events/_events.html',
                controller: 'eventsController'
            });
    }]);

    // This adds a filter that we can use for ng-repeat, useful when we want to paginate something
    app.filter('startFrom', function() {
        return function(input, startFrom) {
            startFrom = +startFrom;
            return input.slice(startFrom);
        };
    });
}(angular));
