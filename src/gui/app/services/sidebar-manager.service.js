"use strict";

(function() {
    angular
        .module("firebotApp")
        .factory("sidebarManager", function($timeout, $rootScope, $location, $translate, settingsService, uiExtensionsService, backendCommunicator) {
            const service = {};

            service.navExpanded = settingsService.getSetting("SidebarExpanded");

            service.toggleNav = function() {
                service.navExpanded = !service.navExpanded;
                $rootScope.$broadcast("navToggled");
                settingsService.saveSetting("SidebarExpanded", service.navExpanded);
            };

            service.currentTab = "chat feed";
            service.currentTabName = "Dashboard";

            service.fullPage = true;
            service.disableScroll = true;

            service.setTab = function(tabId, name, extensionId, extensionPageId) {
                service.currentTab = tabId.toLowerCase();

                service.currentTabName = name ? name : tabId;

                service.fullPage = service.currentTabIsFullScreen(extensionId, extensionPageId);
                service.disableScroll = service.currentTabShouldntScroll(extensionId, extensionPageId);

                //hack that somewhat helps with the autoupdate slider styling issues on first load
                $timeout(function() {
                    $rootScope.$broadcast("rzSliderForceRender");
                }, 50);
            };

            service.tabIsSelected = function(tabId) {
                return service.currentTab.toLowerCase() === tabId.toLowerCase();
            };

            service.currentTabIsFullScreen = function(extensionId, extensionPageId) {
                const isExtensionPage = extensionId != null;
                if (isExtensionPage) {
                    const page = uiExtensionsService.getPage(extensionId, extensionPageId);
                    return page?.fullPage ?? false;
                }
                return [
                    "chat feed",
                    "commands",
                    "preset effect lists",
                    "effect queues",
                    "events",
                    "timers",
                    "channel rewards",
                    "roles and ranks",
                    "moderation",
                    "buttons",
                    "settings",
                    "counters",
                    "hotkeys",
                    "effect queues",
                    "currency",
                    "quotes",
                    "viewers",
                    "variable macros"
                ].includes(service.currentTab.toLowerCase());
            };

            service.currentTabShouldntScroll = function(extensionId, extensionPageId) {
                const isExtensionPage = extensionId != null;
                if (isExtensionPage) {
                    const page = uiExtensionsService.getPage(extensionId, extensionPageId);
                    return page?.disableScroll ?? false;
                }
                return [
                    "chat feed",
                    "commands",
                    "events",
                    "timers",
                    "channel rewards",
                    "roles and ranks",
                    "preset effect lists",
                    "variable macros",
                    "counters",
                    "effect queues",
                    "settings"
                ].includes(service.currentTab.toLowerCase());
            };

            backendCommunicator.on("navigate", (tabId) => {
                switch (tabId) {
                    case "dashboard":
                        $translate("SIDEBAR.CHAT.CHAT_FEED").then((tabName) => {
                            service.setTab("chat feed", tabName);
                            $location.path("/chat-feed");
                        });
                        break;

                    case "commands":
                        $translate("SIDEBAR.CHAT.COMMANDS").then((tabName) => {
                            service.setTab("commands", tabName);
                            $location.path("/commands");
                        });
                        break;

                    case "events":
                        $translate("SIDEBAR.OTHER.EVENTS").then((tabName) => {
                            service.setTab("events", tabName);
                            $location.path("/events");
                        });
                        break;

                    case "time-based":
                        $translate("SIDEBAR.OTHER.TIME_BASED").then((tabName) => {
                            service.setTab("timers", tabName);
                            $location.path("/timers");
                        });
                        break;

                    case "channel-rewards":
                        $translate("SIDEBAR.OTHER.CHANNELREWARDS").then((tabName) => {
                            service.setTab("channel rewards", tabName);
                            $location.path("/channel-rewards");
                        });
                        break;

                    case "preset-effect-lists":
                        $translate("SIDEBAR.OTHER.PRESET_EFFECT_LISTS").then((tabName) => {
                            service.setTab("preset effect lists", tabName);
                            $location.path("/preset-effect-lists");
                        });
                        break;

                    case "hotkeys":
                        $translate("SIDEBAR.OTHER.HOTKEYS").then((tabName) => {
                            service.setTab("hotkeys", tabName);
                            $location.path("/hotkeys");
                        });
                        break;

                    case "counters":
                        $translate("SIDEBAR.OTHER.COUNTERS").then((tabName) => {
                            service.setTab("counters", tabName);
                            $location.path("/counters");
                        });
                        break;

                    default:
                        break;
                }
            });

            return service;
        });

    // routes for tabs
    angular.module("firebotApp").config([
        "$routeProvider",
        "$locationProvider",
        function($routeProvider) {
            $routeProvider

                .when("/roles-and-ranks", {
                    templateUrl: "./templates/_roles-and-ranks.html",
                    controller: "rolesAndRanksController"
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
                })

                .when("/variable-macros", {
                    templateUrl: "./templates/_variable-macros.html",
                    controller: "variableMacrosController"
                })

                .when("/extension/:extensionId/:pageId", {
                    templateUrl: "./templates/_extension-page.html",
                    controller: "extensionPageController"
                });
        }
    ]);
}(window.angular));
