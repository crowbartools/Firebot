"use strict";

(function() {
    angular
        .module("firebotApp")
        .factory("sidebarManager", function($timeout, $rootScope) {
            let service = {};

            service.navExpanded = true;

            service.toggleNav = function() {
                service.navExpanded = !service.navExpanded;
                $rootScope.$broadcast("navToggled");
            };

            service.currentTab = "buttons";
            service.currentTabName = "Controls";

            service.setTab = function(tabId, name) {
                service.currentTab = tabId.toLowerCase();

                service.currentTabName = name ? name : tabId;

                //hack that somewhat helps with the autoupdate slider styling issues on first load
                $timeout(function() {
                    $rootScope.$broadcast("rzSliderForceRender");
                });
                $timeout(function() {
                    $rootScope.$broadcast("rzSliderForceRender");
                }, 50);
            };

            service.tabIsSelected = function(tabId) {
                return service.currentTab.toLowerCase() === tabId.toLowerCase();
            };

            service.currentTabIsFullScreen = function() {
                return (
                    service.currentTab.toLowerCase() === "chat feed" ||
                    service.currentTab.toLowerCase() === "commands" ||
                    service.currentTab.toLowerCase() === "events" ||
                    service.currentTab.toLowerCase() === "moderation" ||
                    service.currentTab.toLowerCase() === "buttons"
                );
            };

            service.currentTabShouldntScroll = function() {
                return (
                    service.currentTab.toLowerCase() === "chat feed" ||
                    service.currentTab.toLowerCase() === "buttons" ||
                    service.currentTab.toLowerCase() === "events" ||
                    service.currentTab.toLowerCase() === "commands"
                );
            };

            return service;
        });

    // routes for tabs
    angular.module("firebotApp").config([
        "$routeProvider",
        "$locationProvider",
        function($routeProvider) {
            $routeProvider

                .when("/", {
                    templateUrl: "./templates/interactive/_interactive.html",
                    controller: "controlsController"
                })

                .when("/viewer-roles", {
                    templateUrl: "./templates/_viewerroles.html",
                    controller: "viewerRolesController"
                })

                .when("/commands", {
                    templateUrl: "./templates/chat/_commands.html",
                    controller: "commandsController"
                })

                .when("/chat-feed", {
                    templateUrl: "./templates/chat/_chat-messages.html",
                    controller: "chatMessagesController"
                })

                .when("/moderation", {
                    templateUrl: "./templates/_moderation.html",
                    controller: "moderationController"
                })

                .when("/settings", {
                    templateUrl: "./templates/_settings.html",
                    controller: "settingsController"
                })

                .when("/updates", {
                    templateUrl: "./templates/_updates.html",
                    controller: "updatesController"
                })

                .when("/events", {
                    templateUrl: "./templates/live-events/_events.html",
                    controller: "eventsController"
                })

                .when("/hotkeys", {
                    templateUrl: "./templates/_hotkeys.html",
                    controller: "hotkeysController"
                })

                .when("/currency", {
                    templateUrl: "./templates/_currency.html",
                    controller: "currencyController"
                })

                .when("/timers", {
                    templateUrl: "./templates/_timers.html",
                    controller: "timersController"
                })

                .when("/viewers", {
                    templateUrl: "./templates/viewers/_viewers.html",
                    controller: "viewersController"
                })

                .when("/quotes", {
                    templateUrl: "./templates/_quotes.html",
                    controller: "quotesController"
                })

                .when("/counters", {
                    templateUrl: "./templates/_counters.html",
                    controller: "countersController"
                })

                .when("/games", {
                    templateUrl: "./templates/_games.html",
                    controller: "gamesController"
                });
        }
    ]);
}(window.angular));
