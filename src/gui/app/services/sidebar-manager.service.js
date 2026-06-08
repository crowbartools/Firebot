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
                    "power-ups and rewards",
                    "roles and ranks",
                    "moderation",
                    "buttons",
                    "settings",
                    "counters",
                    "hotkeys",
                    "control deck",
                    "effect queues",
                    "currency",
                    "quotes",
                    "viewers",
                    "variable macros",
                    "overlay widgets"
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
                    "power-ups and rewards",
                    "roles and ranks",
                    "preset effect lists",
                    "control deck",
                    "variable macros",
                    "counters",
                    "effect queues",
                    "settings",
                    "overlay widgets"
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
                        $translate("SIDEBAR.TRIGGERS.COMMANDS").then((tabName) => {
                            service.setTab("commands", tabName);
                            $location.path("/commands");
                        });
                        break;

                    case "events":
                        $translate("SIDEBAR.TRIGGERS.EVENTS").then((tabName) => {
                            service.setTab("events", tabName);
                            $location.path("/events");
                        });
                        break;

                    case "time-based":
                        $translate("SIDEBAR.TRIGGERS.TIME_BASED").then((tabName) => {
                            service.setTab("timers", tabName);
                            $location.path("/timers");
                        });
                        break;

                    case "power-ups-and-rewards":
                        $translate("SIDEBAR.TRIGGERS.POWERUPS_AND_REWARDS").then((tabName) => {
                            service.setTab("power-ups and rewards", tabName);
                            $location.path("/power-ups-and-rewards");
                        });
                        break;

                    case "preset-effect-lists":
                        $translate("SIDEBAR.TRIGGERS.PRESET_EFFECT_LISTS").then((tabName) => {
                            service.setTab("preset effect lists", tabName);
                            $location.path("/preset-effect-lists");
                        });
                        break;

                    case "hotkeys":
                        $translate("SIDEBAR.TRIGGERS.HOTKEYS").then((tabName) => {
                            service.setTab("hotkeys", tabName);
                            $location.path("/hotkeys");
                        });
                        break;

                    case "control-deck":
                        $translate("SIDEBAR.TRIGGERS.CONTROL_DECK").then((tabName) => {
                            service.setTab("control deck", tabName);
                            $location.path("/control-deck");
                        });
                        break;

                    case "counters":
                        $translate("SIDEBAR.TRIGGERS.COUNTERS").then((tabName) => {
                            service.setTab("counters", tabName);
                            $location.path("/counters");
                        });
                        break;

                    case "overlay-widgets":
                        $translate("SIDEBAR.TRIGGERS.OVERLAY_WIDGETS").then((tabName) => {
                            service.setTab("overlay widgets", tabName);
                            $location.path("/overlay-widgets");
                        });
                        break;

                    case "effect-queues":
                        $translate("SIDEBAR.MANAGEMENT.EFFECT_QUEUES").then((tabName) => {
                            service.setTab("effect queues", tabName);
                            $location.path("/effect-queues");
                        });
                        break;

                    case "variable-macros":
                        $translate("SIDEBAR.MANAGEMENT.VARIABLE_MACROS").then((tabName) => {
                            service.setTab("variable macros", tabName);
                            $location.path("/variable-macros");
                        });
                        break;

                    case "quotes":
                        $translate("SIDEBAR.MANAGEMENT.QUOTES").then((tabName) => {
                            service.setTab("quotes", tabName);
                            $location.path("/quotes");
                        });
                        break;

                    case "games":
                        $translate("SIDEBAR.MANAGEMENT.GAMES").then((tabName) => {
                            service.setTab("games", tabName);
                            $location.path("/games");
                        });
                        break;

                    case "currency":
                        $translate("SIDEBAR.MANAGEMENT.CURRENCY").then((tabName) => {
                            service.setTab("currency", tabName);
                            $location.path("/currency");
                        });
                        break;

                    case "roles-and-ranks":
                        $translate("SIDEBAR.MANAGEMENT.VIEWER_ROLES").then((tabName) => {
                            service.setTab("roles and ranks", tabName);
                            $location.path("/roles-and-ranks");
                        });
                        break;

                    case "viewers":
                        $translate("SIDEBAR.MANAGEMENT.VIEWERS").then((tabName) => {
                            service.setTab("viewers", tabName);
                            $location.path("/viewers");
                        });
                        break;

                    case "moderation":
                        $translate("SIDEBAR.MANAGEMENT.MODERATION").then((tabName) => {
                            service.setTab("moderation", tabName);
                            $location.path("/moderation");
                        });
                        break;

                    case "settings":
                        $translate("SIDEBAR.MANAGEMENT.SETTINGS").then((tabName) => {
                            service.setTab("settings", tabName);
                            $location.path("/settings");
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

                .when("/events", {
                    templateUrl: "./templates/live-events/_events.html",
                    controller: "eventsController"
                })

                .when("/timers", {
                    templateUrl: "./templates/_timers.html",
                    controller: "timersController"
                })

                .when("/power-ups-and-rewards", {
                    templateUrl: "./templates/_power-ups-and-rewards.html",
                    controller: "powerUpsAndRewardsController"
                })

                .when("/preset-effect-lists", {
                    templateUrl: "./templates/_preset-effect-lists.html",
                    controller: "presetEffectListsController"
                })

                .when("/hotkeys", {
                    templateUrl: "./templates/_hotkeys.html",
                    controller: "hotkeysController"
                })

                .when("/control-deck", {
                    templateUrl: "./templates/_control-deck.html",
                    controller: "controlDeckController"
                })

                .when("/counters", {
                    templateUrl: "./templates/_counters.html",
                    controller: "countersController"
                })

                .when("/overlay-widgets", {
                    templateUrl: "./templates/_overlay-widgets.html",
                    controller: "overlayWidgetsController"
                })

                .when("/effect-queues", {
                    templateUrl: "./templates/_effect-queues.html",
                    controller: "effectQueuesController"
                })

                .when("/variable-macros", {
                    templateUrl: "./templates/_variable-macros.html",
                    controller: "variableMacrosController"
                })

                .when("/quotes", {
                    templateUrl: "./templates/_quotes.html",
                    controller: "quotesController"
                })

                .when("/games", {
                    templateUrl: "./templates/_games.html",
                    controller: "gamesController"
                })

                .when("/currency", {
                    templateUrl: "./templates/_currency.html",
                    controller: "currencyController"
                })

                .when("/roles-and-ranks", {
                    templateUrl: "./templates/_roles-and-ranks.html",
                    controller: "rolesAndRanksController"
                })

                .when("/viewers", {
                    templateUrl: "./templates/viewers/_viewers.html",
                    controller: "viewersController"
                })

                .when("/moderation", {
                    templateUrl: "./templates/_moderation.html",
                    controller: "moderationController"
                })

                .when("/settings", {
                    templateUrl: "./templates/_settings.html",
                    controller: "settingsController"
                })

                .when("/extension/:extensionId/:pageId", {
                    templateUrl: "./templates/_extension-page.html",
                    controller: "extensionPageController"
                });
        }
    ]);
}(window.angular));
