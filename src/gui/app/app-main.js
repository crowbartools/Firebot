/* eslint-disable angular/di-unused */
/* eslint-disable angular/no-run-logic */


"use strict";
(function() {
    const electron = require("electron");
    const shell = electron.shell;

    const secrets = require("../../secrets.json");

    const moment = require("moment");
    moment.locale(firebotAppDetails.locale);

    agGrid.initialiseAgGridWithAngular1(angular); // eslint-disable-line no-undef

    const app = angular.module("firebotApp", [
        "ngAnimate",
        "ngRoute",
        "ui.bootstrap",
        "rzModule",
        "ui.select",
        "ngSanitize",
        "ui.select",
        "ui.sortable",
        "ui.validate",
        "ebScrollLock",
        "summernote",
        "pascalprecht.translate",
        "ngToast",
        "agGrid",
        'ngYoutubeEmbed',
        'countUpModule',
        'pageslide-directive',
        'ui.bootstrap.contextMenu',
        'color.picker',
        'ngAria',
        'ui.codemirror'
    ], function($controllerProvider, $compileProvider, $provide, $filterProvider) {
        global.ngProviders = {
            $controllerProvider: $controllerProvider,
            $compileProvider: $compileProvider,
            $provide: $provide,
            $filterProvider: $filterProvider
        };
    });

    app.factory("$exceptionHandler", function(logger) {
    // this catches angular exceptions so we can send it to winston
        return function(exception, cause) {
            console.log(exception || "", cause || {});
            logger.error(exception || "", cause || {});
        };
    });

    app.directive('focusOn', function() {
        // eslint-disable-next-line angular/prefer-component
        return function(scope, elem, attr) {
            scope.$on('focusOn', function(e, name) {
                if (name === attr.focusOn) {
                    elem[0].focus();
                }
            });
        };
    });

    app.factory('focus', function ($rootScope, $timeout) {
        return function(name) {
            $timeout(function () {
                $rootScope.$broadcast('focusOn', name);
            });
        };
    });

    app.config([
        "$translateProvider",
        function($translateProvider) {
            $translateProvider
                .useStaticFilesLoader({
                    prefix: "lang/locale-",
                    suffix: ".json"
                })
                .preferredLanguage("en");
        }
    ]);

    app.config(function($sceDelegateProvider) {
        $sceDelegateProvider.resourceUrlWhitelist([
            'self',
            'https://kit.fontawesome.com/**'
        ]);
    });

    app.config(function($animateProvider) {
        $animateProvider.classNameFilter(/^(?:(?!ng-animate-disabled).)*$/);
    });

    app.config([
        "ngToastProvider",
        function(ngToast) {
            ngToast.configure({
                verticalPosition: "top",
                horizontalPosition: "center",
                maxNumber: 5,
                timeout: 3000,
                className: "danger",
                animation: "fade",
                combineDuplications: true,
                dismissButton: true
            });
        }
    ]);

    app.run(function initializeApplication(
        logger,
        quickActionsService,
        chatMessagesService,
        activityFeedService,
        viewerRolesService,
        viewerRanksService,
        connectionService,
        notificationService,
        $timeout,
        updatesService,
        commandsService,
        integrationService,
        viewersService,
        chatModerationService,
        ttsService,
        settingsService,
        countersService,
        hotkeyService,
        gamesService,
        presetEffectListsService,
        startupScriptsService,
        effectQueuesService,
        timerService,
        scheduledTaskService,
        channelRewardsService,
        sortTagsService,
        iconsService,
        videoService,
        replaceVariableService,
        variableMacroService,
        uiExtensionsService,
        webhooksService,
        overlayWidgetsService,
        dynamicParameterRegistry,
        platformService
    ) {
        // 'chatMessagesService' and 'videoService' are included so they're instantiated on app start

        connectionService.loadProfiles();

        //load viewer roles and ranks
        viewerRolesService.loadCustomRoles();
        viewerRanksService.loadRankLadders();

        //load commands
        commandsService.refreshCommands();

        timerService.loadTimers();

        scheduledTaskService.loadScheduledTasks();

        //get integrations from backend
        integrationService.updateIntegrations();

        viewersService.updateViewers();

        chatModerationService.loadChatModerationData();

        countersService.loadCounters();

        hotkeyService.loadHotkeys();

        gamesService.loadGames();

        presetEffectListsService.loadPresetEffectLists();

        startupScriptsService.loadStartupScripts();

        effectQueuesService.loadEffectQueues();

        channelRewardsService.loadChannelRewards();
        channelRewardsService.refreshChannelRewardRedemptions();

        sortTagsService.loadSortTags();

        iconsService.loadFontAwesomeIcons();

        variableMacroService.loadMacros();

        webhooksService.loadWebhookConfigs();

        overlayWidgetsService.loadOverlayWidgetTypesAndConfigs();

        platformService.loadPlatform();

        //start notification check
        $timeout(() => {
            notificationService.loadAllNotifications();
        }, 1000);

        //check for updates
        if (!updatesService.hasCheckedForUpdates) {
            updatesService.checkForUpdate();
        }

        // Validate Twitch accounts
        connectionService.validateAccounts();

        ttsService.obtainVoices().then(() => {
            if (settingsService.getSetting("DefaultTtsVoiceId") == null) {
                settingsService.saveSetting("DefaultTtsVoiceId", ttsService.getOsDefaultVoiceId());
            }
        });

        // Register built-in dynamic parameter types
        dynamicParameterRegistry.register("string", { tag: "fb-param-string" });
        dynamicParameterRegistry.register("number", { tag: "fb-param-number" });
        dynamicParameterRegistry.register("password", { tag: "fb-param-password" });
        dynamicParameterRegistry.register("boolean", { tag: "fb-param-boolean", hideTitle: true, hideDescription: true });
        dynamicParameterRegistry.register("date-time", { tag: "fb-param-date-time",
            validators: {
                futureOnly: {
                    fn: (view, isFuture) => (
                        view == null || view === ""
                            ? true
                            : isFuture
                                ? new Date(view) > new Date()
                                : new Date(view) < new Date()
                    ),
                    message: isFuture => `Must be in the ${isFuture ? "future" : "past"}.`,
                    async: false
                }
            }
        });
        dynamicParameterRegistry.register("enum", { tag: "fb-param-enum" });
        dynamicParameterRegistry.register("filepath", { tag: "fb-param-filepath" });
        dynamicParameterRegistry.register("role-percentages", { tag: "fb-param-role-percentages" });
        dynamicParameterRegistry.register("role-numbers", { tag: "fb-param-role-numbers" });
        dynamicParameterRegistry.register("currency-select", { tag: "fb-param-currency-select" });
        dynamicParameterRegistry.register("chatter-select", { tag: "fb-param-chatter-select" });
        dynamicParameterRegistry.register("editable-list", { tag: "fb-param-editable-list" });
        dynamicParameterRegistry.register("multiselect", { tag: "fb-param-multiselect" });
        dynamicParameterRegistry.register("discord-channel-webhooks", { tag: "fb-param-discord-channel-webhooks" });
        dynamicParameterRegistry.register("gift-receivers-list", { tag: "fb-param-gift-receivers-list" });
        dynamicParameterRegistry.register("poll-choice-list", { tag: "fb-param-poll-choice-list" });
        dynamicParameterRegistry.register("effectlist", { tag: "fb-param-effect-list" });
        dynamicParameterRegistry.register("button", { tag: "fb-param-button" });
        dynamicParameterRegistry.register("hexcolor", { tag: "fb-param-hex-color" });
        dynamicParameterRegistry.register("font-name", { tag: "fb-param-font-name" });
        dynamicParameterRegistry.register("font-options", { tag: "fb-param-font-options" });
        dynamicParameterRegistry.register("radio-cards", { tag: "fb-param-radio-cards" });
        dynamicParameterRegistry.register("codemirror", { tag: "fb-param-code-mirror" });
        dynamicParameterRegistry.register("counter-select", { tag: "fb-param-counter-select" });
        dynamicParameterRegistry.register("sort-tag-select", { tag: "fb-param-sort-tag-select" });

        uiExtensionsService.setAsReady();
    });

    app.controller("MainController", function($scope, $rootScope, $timeout, connectionService, utilityService,
        settingsService, backupService, sidebarManager, logger, backendCommunicator, fontManager, ngToast, watcherCountService) {
        $rootScope.showSpinner = true;

        $scope.fontAwesome5KitUrl = `https://kit.fontawesome.com/${secrets.fontAwesome5KitId}.js`;

        $scope.sbm = sidebarManager;

        /**
         * rootScope functions. This means they are accessable in all scopes in the front end
         */
        $rootScope.pasteClipboard = function(elementId, shouldUnfocus) {
            angular.element(`#${elementId}`).focus();
            document.execCommand("paste");
            if (shouldUnfocus === true || shouldUnfocus == null) {
                angular.element(`#${elementId}`).blur();
            }
        };

        $rootScope.copyTextToClipboard = function(text, toastConfig = { show: false }) {
            navigator.clipboard.writeText(text).then(function() {
                logger.info("Text copied to clipboard");

                if (toastConfig?.show) {
                    ngToast.create({
                        className: 'info',
                        content: toastConfig.message || `Copied '${text}' to clipboard`
                    });
                }

            }, function(err) {
                logger.error("Could not copy text: ", err);
            });
        };

        backendCommunicator.on("copy-to-clipboard", (data) => {
            if (!data?.text?.length) {
                return;
            }

            $rootScope.copyTextToClipboard(data.text, { show: !data.silent, message: data.toastMessage });

            return;
        });

        $rootScope.openLinkExternally = function(url) {
            shell.openExternal(url);
        };

        /*
        * MANAGE LOGINS MODAL
        */
        $scope.showManageLoginsModal = function() {
            utilityService.showModal({
                component: "loginsModal"
            });
        };

        /*
        * New Profile MODAL
        */
        $scope.showNewProfileModal = function() {
            const showNewProfileModal = {
                templateUrl: "newProfileModal.html",
                size: 'sm',
                // This is the controller to be used for the modal.
                controllerFunc: ($scope, $uibModalInstance, connectionService, ngToast) => {

                    // Login Kickoff
                    $scope.createNewProfile = function() {
                        if ($scope.profileName == null || $scope.profileName === "") {
                            ngToast.create("Please provide a profile name.");
                            return;
                        }
                        $uibModalInstance.close();
                        connectionService.createNewProfile($scope.profileName);
                    };

                    // When they hit cancel or click outside the modal, we don't want to do anything
                    $scope.dismiss = function() {
                        $uibModalInstance.dismiss("cancel");
                    };
                }
            };
            utilityService.showModal(showNewProfileModal);
        };

        /*
        * Rename Profile MODAL
        */
        $scope.showRenameProfileModal = function() {
            const renameProfileModal = {
                templateUrl: "renameProfileModal.html",
                size: 'sm',
                resolveObj: {
                    currentProfileId: () => ipcRenderer.sendSync("profiles:get-logged-in-profile")
                },
                // This is the controller to be used for the modal.
                controllerFunc: ($scope, $uibModalInstance, connectionService, ngToast, currentProfileId) => {

                    $scope.profileName = currentProfileId;

                    // Login Kickoff
                    $scope.renameProfile = function() {
                        if ($scope.profileName == null || $scope.profileName === "") {
                            ngToast.create("Please provide a profile name.");
                            return;
                        }
                        $uibModalInstance.close();
                        connectionService.renameProfile($scope.profileName);
                    };

                    // When they hit cancel or click outside the modal, we don't want to do anything
                    $scope.dismiss = function() {
                        $uibModalInstance.dismiss("cancel");
                    };
                }
            };
            utilityService.showModal(renameProfileModal);
        };



        /*
        * Delete Profile MODAL
        */
        $scope.showDeleteProfileModal = function() {
            const deleteProfileModal = {
                templateUrl: "deleteProfileModal.html",
                size: 'sm',
                // This is the controller to be used for the modal.
                controllerFunc: ($scope, $uibModalInstance, connectionService) => {
                    // Delete Profile
                    $scope.deleteProfile = function() {
                        $uibModalInstance.close();
                        connectionService.deleteProfile();
                    };

                    // When they hit cancel or click outside the modal, we don't want to do anything
                    $scope.dismiss = function() {
                        $uibModalInstance.dismiss("cancel");
                    };
                }
            };
            utilityService.showModal(deleteProfileModal);
        };

        // Switch Profiles
        $scope.switchProfiles = function(profileId) {
            if (profileId !== $scope.currentProfileId) {
                utilityService
                    .showConfirmationModal({
                        title: "Switch Profile",
                        question: "Switching profiles will cause the app to restart. Do you still want to switch profiles?",
                        confirmLabel: "Switch & Restart App",
                        confirmBtnType: "btn-info"
                    })
                    .then((confirmed) => {
                        if (confirmed) {
                            connectionService.switchProfiles(profileId);
                        }
                    });
            }
        };

        $scope.currentProfileId = ipcRenderer.sendSync("profiles:get-logged-in-profile");

        /**
         * Initial App Load
         */
        $scope.cs = connectionService;
        //$scope.accounts = connectionService.accounts;
        //$scope.profiles = connectionService.profiles;

        if (settingsService.getSetting("JustUpdated")) {
            utilityService.showUpdatedModal();
            settingsService.saveSetting("JustUpdated", false);
        } else if (settingsService.getSetting("FirstTimeUse")) {
            utilityService.showSetupWizard();
            settingsService.saveSetting("FirstTimeUse", false);
        }

        /**
         * Connection stuff
         */

        // Get app version and change titlebar.
        const appVersion = firebotAppDetails.version;
        $scope.appTitle = `Firebot v${appVersion}`;

        const url = require("url");
        $scope.customFontCssPath = url.pathToFileURL(fontManager.getFontCssPath());

        backendCommunicator.on("fonts:reload-font-css", () => {
            $scope.customFontCssPath = `${url.pathToFileURL(fontManager.getFontCssPath())}?reload=${new Date().getTime()}`;
        });

        //make sure sliders render properly
        $timeout(function() {
            $scope.$broadcast("rzSliderForceRender");
        }, 250);

        // Apply Theme
        $scope.appTheme = function() {
            return settingsService.getSetting("Theme");
        };

        $rootScope.showSpinner = false;

        backendCommunicator.on("open-about-modal", () => {
            utilityService.showModal({
                component: "aboutModal",
                size: "sm",
                backdrop: true
            });
        });

        backendCommunicator.on("open-modal", (modalConfig) => {
            utilityService.showModal(modalConfig);
        });

        backendCommunicator.on("setup-opened", (path) => {
            utilityService.showModal({
                component: "importSetupModal",
                backdrop: false,
                resolveObj: {
                    setupFilePath: () => path
                }
            });
        });

        backendCommunicator.on("backups:start-restore-backup", () => {
            backupService.openBackupZipFilePicker()
                .then((backupFilePath) => {
                    if (backupFilePath != null) {
                        utilityService
                            .showConfirmationModal({
                                title: "Restore From Backup",
                                question: "Are you sure you'd like to restore from this backup?",
                                confirmLabel: "Restore"
                            })
                            .then((confirmed) => {
                                if (confirmed) {
                                    backupService.initiateBackupRestore(backupFilePath);
                                }
                            });
                    }
                });
        });

        //show puzzle
        /*utilityService.showModal({
            component: "puzzleModal",
            keyboard: false,
            backdrop: "static"
        });*/
    });

    // This adds a filter that we can use for ng-repeat, useful when we want to paginate something
    app.filter("startFrom", function() {
        return function(input, startFrom) {
            if (!input) {
                return input;
            }
            startFrom = +startFrom;
            return input.slice(startFrom);
        };
    });

    // eslint-disable-next-line angular/no-services
    app.filter("dynamicFilter", ($filter) => {
        return function(items, filterName, ...args) {
            return $filter(filterName ?? "filter")(items, ...args);
        };
    });

    // This adds a filter that we can use for searching command triggers
    app.filter("triggerSearch", function() {
        return function(commands, query) {
            if (commands == null || query == null) {
                return commands;
            }
            return commands.filter(c =>
                c.trigger.toLowerCase().includes(query.toLowerCase())
            );
        };
    });


    app.filter("sortTagSearch", function() {
        return function(elements, tag) {
            if (elements == null || tag == null) {
                return elements;
            }
            return elements.filter((e) => {
                if (tag.id === "none" && (e.sortTags == null || e.sortTags.length < 1)) {
                    return true;
                }
                return e.sortTags != null && e.sortTags.some(t => t === tag.id);
            }
            );
        };
    });

    app.filter("hideBotMessages", function(settingsService, accountAccess) {
        return function(elements) {
            const shouldHide = settingsService.getSetting("ChatHideBotAccountMessages");
            if (!shouldHide) {
                return elements;
            }
            const botAccountName = accountAccess.accounts.bot.username.toLowerCase();
            return elements.filter((e) => {
                if (e.type !== 'message') {
                    return true;
                }
                return e.data.username?.toLowerCase() !== botAccountName;
            }
            );
        };
    });

    app.filter("hideHiddenMessages", function() {
        return function(elements) {
            return elements.filter((e) => {
                if (e.type !== 'message') {
                    return true;
                }
                return e.data.isHiddenFromChatFeed !== true;
            }
            );
        };
    });

    app.filter("hideWhispers", function(settingsService) {
        return function(elements) {
            const shouldHide = settingsService.getSetting("ChatHideWhispers");
            if (!shouldHide) {
                return elements;
            }
            return elements.filter((e) => {
                if (e.type !== 'message') {
                    return true;
                }
                return e.data.whisper !== true;
            }
            );
        };
    });

    app.filter("chatUserRole", function() {
        return function(users, role) {
            if (users == null || role == null) {
                return users;
            }
            return users.filter((u) => {
                if (role === "broadcaster") {
                    return u.roles.includes("broadcaster");
                } else if (role === "viewer") {
                    return !u.roles.includes("broadcaster")
                        && !u.roles.includes("mod")
                        && !u.roles.includes("vip")
                        && !u.roles.includes("viewerlistbot");
                } else if (role === "mod") {
                    return u.roles.includes("mod");
                } else if (role === "vip") {
                    return u.roles.includes("vip");
                } else if (role === "viewerlistbot") {
                    return u.roles.includes("viewerlistbot");
                }
                return true;
            }
            );
        };
    });


    // This adds a filter that we can use for searching variables
    app.filter("variableSearch", function() {
        return function(variables, query) {
            if (variables == null || query == null) {
                return variables;
            }
            const normalizedQuery = query.replace("$", "").toLowerCase();
            return variables
                .filter(v =>
                    v.handle.toLowerCase().includes(normalizedQuery) || v.aliases?.some(a => a.toLowerCase().includes(normalizedQuery))
                );
        };
    });

    // This adds a filter that we can use for searching icons
    app.filter("iconSearch", function() {
        return function(icons, query) {
            if (icons == null || query == null) {
                return icons;
            }
            const normalizedQuery = query.toLowerCase();
            return icons
                .filter((v) => {
                    const terms = `${v.style} ${v.name} ${v.searchTerms.join(" ")}`;

                    return terms.toLowerCase().includes(normalizedQuery);
                });
        };
    });

    // This adds a filter that we can use for searching effects
    app.filter("effectCategoryFilter", function() {
        return function(effects, category) {
            if (effects == null || category == null) {
                return effects;
            }
            return effects
                .filter(v =>
                    v.categories && v.categories.includes(category)
                );
        };
    });

    // This adds a filter that we can use for searching variables
    app.filter("variableCategoryFilter", function() {
        return function(variables, category) {
            if (variables == null || category == null) {
                return variables;
            }
            return variables
                .filter(v =>
                    v.categories && v.categories.includes(category)
                );
        };
    });

    app.filter('capitalize', function() {
        return function(input) {
            return (input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
        };
    });

    app.filter('prettyDate', function() {
        return function(input) {
            return (input) ? moment(input).format('L') : 'Not saved';
        };
    });

    app.filter('timeFromNow', function() {
        return function(input, hideSuffix = false) {
            return moment(input).fromNow(hideSuffix);
        };
    });

    app.filter('hideEmptyRewardQueues', function() {
        return function(queue) {
            const newQueueObj = { ...queue };
            for (const key in newQueueObj) {
                if (newQueueObj[key].length === 0) {
                    delete newQueueObj[key];
                }
            }
            return newQueueObj;
        };
    });

    app.filter('commify', function() {
        return function(input) {
            return input ? input.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "";
        };
    });

    app.filter('reverseChat', function() {
        return (items, reverse) => {
            return reverse === true
                ? items.toReversed()
                : items;
        };
    });

}(angular));