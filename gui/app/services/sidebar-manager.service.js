"use strict";

(function() {
    angular
        .module("firebotApp")
        .factory("sidebarManager", function($timeout, $rootScope, settingsService) {
            let service = {};

            service.navExpanded = settingsService.getSidebarExpanded();

            service.toggleNav = function() {
                service.navExpanded = !service.navExpanded;
                $rootScope.$broadcast("navToggled");
                settingsService.setSidebarExpanded(service.navExpanded);
            };

            service.currentTab = "chat feed";
            service.currentTabName = "Dashboard";

            service.setTab = function(tabId, name) {
                service.currentTab = tabId.toLowerCase();

                service.currentTabName = name ? name : tabId;

                //hack that somewhat helps with the autoupdate slider styling issues on first load
                $timeout(function() {
                    $rootScope.$broadcast("rzSliderForceRender");
                }, 50);
            };

            service.tabIsSelected = function(tabId) {
                return service.currentTab.toLowerCase() === tabId.toLowerCase();
            };

            service.currentTabIsFullScreen = function() {
                return [
                    "chat feed",
                    "commands",
                    "preset effect lists",
                    "effect queues",
                    "events",
                    "timers",
                    "channel rewards",
                    "moderation",
                    "buttons",
                    "settings"
                ].includes(service.currentTab.toLowerCase());
            };

            service.currentTabShouldntScroll = function() {
                return [
                    "chat feed",
                    "commands",
                    "preset effect lists",
                    "events",
                    "timers",
                    "channel rewards",
                    "buttons",
                    "settings"
                ].includes(service.currentTab.toLowerCase());
            };

            return service;
        });

    // routes for tabs
    angular.module("firebotApp").config([
        "$routeProvider",
        "$locationProvider",
        function($routeProvider) {
            $routeProvider

                .when("/viewer-roles", {
                    templateUrl: "./templates/_viewerroles.html",
                    controller: "viewerRolesController"
                })

                .when("/", {
                    templateUrl: "./templates/chat/_chat-messages.html",
                    controller: "chatMessagesController"
                })

                .when("/chat-feed", {
                    templateUrl: "./templates/chat/_chat-messages.html",
                    controller: "chatMessagesController"
                })

                .when("/commands", {
                    templateUrl: "./templates/chat/_commands.html",
                    controller: "commandsController"
                })

                .when("/preset-effect-lists", {
                    templateUrl: "./templates/_preset-effect-lists.html",
                    controller: "presetEffectListsController"
                })

                .when("/effect-queues", {
                    templateUrl: "./templates/_effect-queues.html",
                    controller: "effectQueuesController"
                })

                .when("/channel-rewards", {
                    templateUrl: "./templates/_channel-rewards.html",
                    controller: "channelRewardsController"
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
