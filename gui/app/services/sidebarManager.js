'use strict';


(function() {

    angular
        .module('firebotApp')
        .factory('sidebarManager', function ($timeout, $rootScope) {
            let service = {};

            service.navExpanded = true;

            service.toggleNav = function() {
                service.navExpanded = !service.navExpanded;
            };

            service.currentTab = "buttons";

            service.setTab = function(tabId) {
                service.currentTab = tabId.toLowerCase();

                //hack that somewhat helps with the autoupdate slider styling issues on first load
                $timeout(function () {
                    $rootScope.$broadcast('rzSliderForceRender');
                });
                $timeout(function () {
                    $rootScope.$broadcast('rzSliderForceRender');
                }, 50);
            };

            service.tabIsSelected = function(tabId) {
                return service.currentTab.toLowerCase() === tabId.toLowerCase();
            };

            service.currentTabIsFullScreen = function() {
                return service.currentTab.toLowerCase() === 'chat feed';
            };

            return service;
        });


    // routes for tabs
    angular
        .module('firebotApp').config(['$routeProvider', '$locationProvider', function($routeProvider) {
            $routeProvider

                .when('/', {
                    templateUrl: './templates/interactive/_interactive.html',
                    controller: 'interactiveController'
                })

                .when('/viewer-groups', {
                    templateUrl: './templates/_viewergroups.html',
                    controller: 'groupsController'
                })

                .when('/commands', {
                    templateUrl: './templates/chat/_commands.html',
                    controller: 'commandsController'
                })

                .when('/chat-feed', {
                    templateUrl: './templates/chat/_chat-messages.html',
                    controller: 'chatMessagesController'
                })

                .when('/moderation', {
                    templateUrl: './templates/_moderation.html',
                    controller: 'moderationController'
                })

                .when('/settings', {
                    templateUrl: './templates/_settings.html',
                    controller: 'settingsController'
                })

                .when('/updates', {
                    templateUrl: './templates/_updates.html',
                    controller: 'updatesController'
                })

                .when('/events', {
                    templateUrl: './templates/live-events/_events.html',
                    controller: 'eventsController'
                })

                .when('/hotkeys', {
                    templateUrl: './templates/_hotkeys.html',
                    controller: 'hotkeysController'
                });
        }]);
}(window.angular));
