'use strict';
(function() {

    const electron = require('electron');
    const shell = electron.shell;

    let app = angular
        .module('firebotApp',
            ['ngAnimate', 'ngRoute', 'ui.bootstrap', 'rzModule', 'ui.select', 'ngSanitize', 'ui.select', 'ui.sortable',
                'ngScrollGlue', 'summernote']);

    app.factory('$exceptionHandler',
        function(logger) {
            // this catches angular exceptions so we can send it to winston
            return function(exception, cause) {
                logger.error(cause, exception);
            };
        }
    );

    app.run(
        function initializeApplication(logger, chatMessagesService, groupsService, connectionService, notificationService,
            $timeout, updatesService, commandsService) {
            // 'chatMessagesService' is included so its instantiated on app start

            // Run loadLogin to update the UI on page load.
            connectionService.loadLogin();

            //Attempt to load viewer groups into memory
            groupsService.loadViewerGroups();

            //load commands
            commandsService.refreshCommands();

            //start notification check
            $timeout(() => {
                notificationService.loadAllNotifications();
                notificationService.startExternalIntervalCheck();
            }, 1000);

            //check for updates
            if (!updatesService.hasCheckedForUpdates) {
                updatesService.checkForUpdate();
            }
        }
    );

    app.controller('MainController', function($scope, $rootScope, $timeout, boardService,
        connectionService, connectionManager, utilityService, settingsService, updatesService,
        eventLogService, websocketService, sidebarManager, logger) {

        $rootScope.showSpinner = true;

        $scope.sbm = sidebarManager;

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
                logger.info('Copying text command was ' + msg);
            } catch (err) {
                logger.error('Oops, unable to copy text to clipboard.');
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

                    $scope.reauthForClips = function() {
                        connectionService.reauthForClips();
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

        /**
         * Initial App Load
        */

        $scope.accounts = connectionService.accounts;

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

        // Get app version and change titlebar.
        let appVersion = electron.remote.app.getVersion();
        $scope.appTitle = 'Firebot Interactive || v' + appVersion + ' || @FirebotApp';


        //make sure sliders render properly
        $timeout(function () {
            $scope.$broadcast('rzSliderForceRender');
        }, 250);

        // Apply Theme
        $scope.appTheme = function() {
            return settingsService.getTheme();
        };

        $rootScope.showSpinner = false;
    });

    // This adds a filter that we can use for ng-repeat, useful when we want to paginate something
    app.filter('startFrom', function() {
        return function(input, startFrom) {
            startFrom = +startFrom;
            return input.slice(startFrom);
        };
    });
}(angular));
