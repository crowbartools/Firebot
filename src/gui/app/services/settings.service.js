"use strict";
(function () {
    //This handles settings access for frontend

    const fs = require("fs");
    const { ipcRenderer } = require("electron");

    angular
        .module("firebotApp")
        .factory("settingsService", function (utilityService, logger, profileManager, dataAccess, backendCommunicator) {
            const service = {};

            let settingsCache = {};

            backendCommunicator.on("flush-settings-cache", () => {
                settingsCache = {};
            });

            backendCommunicator.on("settings-updated-main", (settingsUpdate) => {
                if (settingsUpdate == null) {
                    return;
                }
                const { path, data } = settingsUpdate;
                if (path == null || path === '') {
                    return;
                }
                settingsCache[path] = data;
            });

            function getSettingsFile() {
                return profileManager.getJsonDbInProfile("/settings");
            }

            function pushDataToFile(path, data) {
                try {
                    getSettingsFile().push(path, data);
                    settingsCache[path] = data;
                    backendCommunicator.fireEvent("settings-updated-renderer", { path, data });
                } catch (err) { } //eslint-disable-line no-empty
            }

            function getDataFromFile(path, forceCacheUpdate, defaultValue) {
                try {
                    if (settingsCache[path] == null || forceCacheUpdate) {
                        const data = getSettingsFile().getData(path);
                        settingsCache[path] = data ?? defaultValue;
                    }
                } catch (err) {
                    if (defaultValue !== undefined) {
                        settingsCache[path] = defaultValue;
                    }
                    if (err.name !== "DataError") {
                        logger.warn(err);
                    }
                }
                return settingsCache[path];
            }

            function deleteDataAtPath(path) {
                try {
                    getSettingsFile().delete(path);
                    delete settingsCache[path];
                    backendCommunicator.fireEvent("settings-updated-renderer", { path, data: null });
                } catch (err) { } //eslint-disable-line no-empty
            }

            service.purgeSettingsCache = function () {
                settingsCache = {};
                backendCommunicator.fireEvent("purge-settings-cache");
            };

            service.getCustomScriptsEnabled = function () {
                return getDataFromFile("/settings/runCustomScripts", false, false) === true;
            };

            service.setCustomScriptsEnabled = function (enabled) {
                pushDataToFile("/settings/runCustomScripts", enabled === true);
            };

            service.getSidebarExpanded = function () {
                const expanded = getDataFromFile("/settings/sidebarExpanded", false, true);
                return expanded != null ? expanded : true;
            };

            service.setSidebarExpanded = function (expanded) {
                pushDataToFile("/settings/sidebarExpanded", expanded === true);
            };

            service.getDefaultToAdvancedCommandMode = function () {
                return getDataFromFile("/settings/defaultToAdvancedCommandMode", false, false) === true;
            };

            service.setDefaultToAdvancedCommandMode = function (defaultToAdvanced) {
                pushDataToFile("/settings/defaultToAdvancedCommandMode", defaultToAdvanced === true);
            };

            service.getSeenAdvancedCommandModePopup = function () {
                return getDataFromFile("/settings/seenAdvancedCommandModePopup", false, false) === true;
            };

            service.setSeenAdvancedCommandModePopup = function (seen) {
                pushDataToFile("/settings/seenAdvancedCommandModePopup", seen === true);
            };

            service.getPersistCustomVariables = function () {
                return getDataFromFile("/settings/persistCustomVariables", false, false) === true;
            };

            service.setPersistCustomVariables = function (enabled) {
                pushDataToFile("/settings/persistCustomVariables", enabled === true);
            };

            service.getAllowQuoteCSVDownloads = function () {
                return getDataFromFile("/settings/allowQuoteCSVDownloads", false, true) !== false;
            };

            service.setAllowQuoteCSVDownloads = function (enabled) {
                pushDataToFile("/settings/allowQuoteCSVDownloads", enabled === true);
            };

            service.legacySortTagsImported = function () {
                return getDataFromFile("/settings/legacySortTagsImported", false, false) === true;
            };

            service.setLegacySortTagsImported = function (enabled) {
                pushDataToFile("/settings/legacySortTagsImported", enabled === true);
            };

            service.getViewerListPageSize = function () {
                const viewerListPageSize = getDataFromFile("/settings/viewerListDatabase/pageSize", false, 10);
                return viewerListPageSize != null ? viewerListPageSize : 10;
            };

            service.setViewerListPageSize = function (viewerListPageSize = 10) {
                pushDataToFile("/settings/viewerListDatabase/pageSize", viewerListPageSize);
            };

            service.isBetaTester = function () {
                const betaTester = getDataFromFile("/settings/beta", false, "No");
                return betaTester != null ? betaTester : "No";
            };

            service.setBetaTester = function (isTester) {
                pushDataToFile("/settings/beta", isTester);
            };

            service.getEmulator = function () {
                const emulator = getDataFromFile("/settings/emulation", false, "nut-js");
                return emulator != null ? emulator : "nut-js";
            };

            service.setEmulator = function (emulator) {
                pushDataToFile("/settings/emulation", emulator);
            };

            service.getViewerDB = function () {
                let viewerDB = getDataFromFile("/settings/viewerDB");

                // If viewerDB setting is not set, default to true to avoid future "cant find datapath" errors.
                if (viewerDB == null) {
                    logger.debug('Viewer DB setting not found. Defaulting to true.');
                    service.setViewerDB(true);
                    viewerDB = getDataFromFile("/settings/viewerDB");
                }
                return viewerDB != null ? viewerDB : true;
            };

            service.setViewerDB = function (status) {
                pushDataToFile("/settings/viewerDB", status);

                if (status === true) {
                    ipcRenderer.send("connect-viewer-db");
                } else {
                    ipcRenderer.send("disconnect-viewer-db");
                }
            };

            service.getAutoFlagBots = function () {
                let autoFlagBots = getDataFromFile("/settings/autoFlagBots");

                // If viewerDB setting is not set, default to true to avoid future "cant find datapath" errors.
                if (autoFlagBots == null) {
                    logger.debug('Auto Flag Bots setting not found. Defaulting to true.');
                    service.setAutoFlagBots(true);
                    autoFlagBots = getDataFromFile("/settings/viewerDB");
                }
                return autoFlagBots != null ? autoFlagBots : true;
            };

            service.setAutoFlagBots = function (status) {
                pushDataToFile("/settings/autoFlagBots", status);
            };

            // Used for settings menu.
            service.getChatFeed = function () {
                const chatFeed = getDataFromFile("/settings/chatFeed", false, false);
                if (chatFeed === true) {
                    return "On";
                }
                return "Off";
            };

            // Used for the app itself.
            service.getRealChatFeed = function () {
                return true;
            };

            service.chatFeedEnabled = function () {
                return true;
            };

            service.setChatFeed = function () { };

            // Used for settings menu.
            service.getChatViewCount = function () {
                const chatViewCount = getDataFromFile("/settings/chatViewCount", false, "Off");
                if (chatViewCount === true) {
                    return "On";
                }
                return "Off";
            };

            service.setChatViewCount = function (chatViewCount) {
                pushDataToFile("/settings/chatViewCount", chatViewCount === true);
            };

            service.getViewerCount = function () {
                return getDataFromFile("/settings/chatViewCount");
            };

            service.getQuickActionSettings = () => {
                return getDataFromFile("/settings/quickActions");
            };

            service.setQuickActionSettings = (quickActions) => {
                pushDataToFile("/settings/quickActions", quickActions);
            };

            service.setDashboardLayoutSettings = (layoutSettings) => {
                pushDataToFile("/settings/dashboard/layout", layoutSettings);
            };

            service.getDashboardLayoutSettings = () => {
                return getDataFromFile("/settings/dashboard/layout");
            };

            service.getShowChatViewerList = function () {
                const value = getDataFromFile("/settings/chatUsersList", false, true);
                return value == null ? true : value;
            };

            service.setShowChatViewerList = function (chatViewerList) {
                pushDataToFile("/settings/chatUsersList", chatViewerList === true);
            };

            service.showActivityFeed = function () {
                const show = getDataFromFile("/settings/activityFeed", false, true);
                return show == null ? true : show;
            };

            service.setShowActivityFeed = function (showActivityFeed) {
                pushDataToFile("/settings/activityFeed", showActivityFeed === true);
            };

            service.getAllowedActivityEvents = function () {
                const events = getDataFromFile("/settings/allowedActivityEvents");
                return events == null ? [
                    "twitch:raid",
                    "twitch:raid-sent-off",
                    "twitch:follow",
                    "twitch:sub",
                    "twitch:subs-gifted",
                    "twitch:community-subs-gifted",
                    "twitch:cheer",
                    "streamlabs:donation",
                    "streamlabs:eldonation",
                    'extralife:donation',
                    "tipeeestream:donation",
                    "streamelements:donation",
                    "twitch:channel-reward-redemption"
                ] : events;
            };

            service.setAllowedActivityEvents = function (events) {
                if (events == null || !Array.isArray(events)) {
                    return;
                }
                pushDataToFile("/settings/allowedActivityEvents", events);
            };

            service.ignoreSubsequentSubEventsAfterCommunitySub = function () {
                const ignoreSubEvents = getDataFromFile("/settings/ignoreSubsequentSubEventsAfterCommunitySub", false, true);
                return ignoreSubEvents != null ? ignoreSubEvents : true;
            };

            service.setIgnoreSubsequentSubEventsAfterCommunitySub = function (ignoreSubEvents) {
                pushDataToFile("/settings/ignoreSubsequentSubEventsAfterCommunitySub", ignoreSubEvents === true);
            };

            service.getWysiwygBackground = function () {
                const bg = getDataFromFile("/settings/wysiwygBackground", false, 'white');
                return bg != null ? bg : 'white';
            };

            service.setWysiwygBackground = function (bg) {
                pushDataToFile("/settings/wysiwygBackground", bg);
            };

            service.getClearChatFeedMode = function () {
                const mode = getDataFromFile("/settings/clearChatFeedMode", false, 'onlyStreamer');
                return mode != null ? mode : 'onlyStreamer';
            };

            service.setClearChatFeedMode = function (mode) {
                pushDataToFile("/settings/clearChatFeedMode", mode);
            };

            service.isChatCompactMode = function () {
                const compact = getDataFromFile("/settings/chatCompactMode", false, false);
                return compact != null ? compact : false;
            };

            service.setChatCompactMode = function (compact) {
                pushDataToFile("/settings/chatCompactMode", compact === true);
            };

            service.getShowAvatars = function () {
                const value = getDataFromFile("/settings/chatAvatars", false, true);
                return value != null ? value : true;
            };
            service.setShowAvatars = function (value) {
                pushDataToFile("/settings/chatAvatars", value === true);
            };

            service.getShowTimestamps = function () {
                const value = getDataFromFile("/settings/chatTimestamps", false, true);
                return value != null ? value : true;
            };
            service.setShowTimestamps = function (value) {
                pushDataToFile("/settings/chatTimestamps", value === true);
            };

            service.getShowThirdPartyEmotes = function () {
                const value = getDataFromFile("/settings/chatThirdPartyEmotes", false, true);
                return value != null ? value : true;
            };

            service.getShowBttvEmotes = function () {
                const value = getDataFromFile("/settings/chat/emotes/bttv", false, service.getShowThirdPartyEmotes());
                return value != null ? value : service.getShowThirdPartyEmotes();
            };
            service.setShowBttvEmotes = function (value) {
                pushDataToFile("/settings/chat/emotes/bttv", value === true);
            };

            service.getShowFfzEmotes = function () {
                const value = getDataFromFile("/settings/chat/emotes/ffz", false, service.getShowThirdPartyEmotes());
                return value != null ? value : service.getShowThirdPartyEmotes();
            };
            service.setShowFfzEmotes = function (value) {
                pushDataToFile("/settings/chat/emotes/ffz", value === true);
            };

            service.getShowSevenTvEmotes = function () {
                const value = getDataFromFile("/settings/chat/emotes/seventv", false, service.getShowThirdPartyEmotes());
                return value != null ? value : service.getShowThirdPartyEmotes();
            };
            service.setShowSevenTvEmotes = function (value) {
                pushDataToFile("/settings/chat/emotes/seventv", value === true);
            };

            service.getShowPronouns = function () {
                const value = getDataFromFile("/settings/chatPronouns", false, true);
                return value != null ? value : true;
            };
            service.setShowPronouns = function (value) {
                pushDataToFile("/settings/chatPronouns", value === true);
            };

            service.getChatCustomFontSizeEnabled = function () {
                const value = getDataFromFile("/settings/chatCustomFontSizeEnabled", false, false);
                return value != null ? value : false;
            };
            service.setChatCustomFontSizeEnabled = function (value) {
                pushDataToFile("/settings/chatCustomFontSizeEnabled", value === true);
            };

            service.getChatCustomFontSize = function () {
                const value = getDataFromFile("/settings/chatCustomFontSize", false, 17);
                return value != null ? value : 17;
            };
            service.setChatCustomFontSize = function (value) {
                pushDataToFile("/settings/chatCustomFontSize", value);
            };

            service.chatAlternateBackgrounds = function () {
                const alternate = getDataFromFile('/settings/chatAlternateBackgrounds', false, true);
                return alternate != null ? alternate : true;
            };

            service.setChatAlternateBackgrounds = function (alternate) {
                pushDataToFile('/settings/chatAlternateBackgrounds', alternate === true);
            };

            service.chatHideBotAccountMessages = function () {
                const shouldHide = getDataFromFile('/settings/chatHideBotAccountMessages', false, false);
                return shouldHide != null ? shouldHide : false;
            };

            service.setChatHideBotAccountMessages = function (shouldHide) {
                pushDataToFile('/settings/chatHideBotAccountMessages', shouldHide === true);
            };

            service.getChatHideWhispers = function () {
                const shouldHide = getDataFromFile('/settings/chatHideWhispers', false, false);
                return shouldHide === true;
            };

            service.setChatHideWhispers = function (shouldHide) {
                pushDataToFile('/settings/chatHideWhispers', shouldHide === true);
            };

            service.getShowUptimeStat = function () {
                const value = getDataFromFile("/settings/showUptimeStat", false, true);
                return value != null ? value : true;
            };
            service.setShowUptimeStat = function (value) {
                pushDataToFile("/settings/showUptimeStat", value === true);
            };
            service.getShowViewerCountStat = function () {
                const value = getDataFromFile("/settings/showViewerCountStat", false, true);
                return value != null ? value : true;
            };
            service.setShowViewerCountStat = function (value) {
                pushDataToFile("/settings/showViewerCountStat", value === true);
            };
            service.getShowHypeTrainIndicator = function () {
                const value = getDataFromFile("/settings/showHypeTrainIndicator", false, true);
                return value != null ? value : true;
            };
            service.setShowHypeTrainIndicator = function (value) {
                pushDataToFile("/settings/showHypeTrainIndicator", value === true);
            };

            service.getShowAdBreakIndicator = function () {
                const value = getDataFromFile("/settings/showAdBreakIndicator", false, true);
                return value != null ? value : true;
            };

            service.setShowAdBreakIndicator = function (value) {
                pushDataToFile("/settings/showAdBreakIndicator", value === true);
            };

            service.getTriggerUpcomingAdBreakMinutes = function () {
                const value = getDataFromFile("/settings/triggerUpcomingAdBreakMinutes", false, 0);
                return value ?? 0;
            };

            service.setTriggerUpcomingAdBreakMinutes = function (value) {
                pushDataToFile("/settings/triggerUpcomingAdBreakMinutes", value);
            };

            service.chatHideDeletedMessages = function () {
                const hide = getDataFromFile('/settings/chatHideDeletedMessages', false, false);
                return hide != null ? hide : false;
            };

            service.setChatHideDeletedMessages = function (hide) {
                pushDataToFile('/settings/chatHideDeletedMessages', hide === true);
            };

            service.getOverlayCompatibility = function () {
                const overlay = getDataFromFile("/settings/overlayImages", false, "Other");
                return overlay != null ? overlay : "Other";
            };

            service.setOverlayCompatibility = function (overlay) {
                const overlaySetting = overlay === "OBS" ? overlay : "Other";
                pushDataToFile("/settings/overlayImages", overlaySetting);
            };

            service.getTheme = function () {
                const theme = getDataFromFile("/settings/theme", false, "Obsidian");
                return theme != null ? theme : "Obsidian";
            };

            service.setTheme = function (theme) {
                pushDataToFile("/settings/theme", theme);
            };

            service.soundsEnabled = function () {
                const sounds = getDataFromFile("/settings/sounds", false, "On");
                return sounds != null ? sounds : "On";
            };

            service.setSoundsEnabled = function (enabled) {
                pushDataToFile("/settings/sounds", enabled);
            };

            service.getOpenStreamPreviewOnLaunch = () => {
                const openStreamPreviewOnLaunch = getDataFromFile("/settings/openStreamPreviewOnLaunch", false, false);
                return openStreamPreviewOnLaunch === true;
            };

            service.setOpenStreamPreviewOnLaunch = (enabled) => {
                pushDataToFile("/settings/openStreamPreviewOnLaunch", enabled === true);
            };

            service.getActiveChatUserListTimeout = function () {
                const inactiveTimer = getDataFromFile("/settings/activeChatUsers/inactiveTimer", false, 5);
                return inactiveTimer != null ? parseInt(inactiveTimer) : 5;
            };

            service.setActiveChatUserListTimeout = function (inactiveTimer) {
                pushDataToFile("/settings/activeChatUsers/inactiveTimer", inactiveTimer);
            };

            /*
            * 0 = off,
            * 1 = bugfix,
            * 2 = feature,
            * 3 = major release,
            * 4 = betas
            */
            service.getAutoUpdateLevel = function () {
                const updateLevel = getDataFromFile("/settings/autoUpdateLevel", false, 2);
                return updateLevel != null ? updateLevel : 2;
            };

            service.setAutoUpdateLevel = function (updateLevel) {
                pushDataToFile("/settings/autoUpdateLevel", updateLevel);
            };

            service.notifyOnBeta = function () {
                const beta = getDataFromFile("/settings/notifyOnBeta", false, false);
                return beta != null ? beta : false;
            };

            service.setNotifyOnBeta = function (beta) {
                pushDataToFile("/settings/notifyOnBeta", beta === true);
            };

            service.isFirstTimeUse = function () {
                const ftu = getDataFromFile("/settings/firstTimeUse", false, true);
                return ftu != null ? ftu : true;
            };

            service.setFirstTimeUse = function (ftu) {
                pushDataToFile("/settings/firstTimeUse", ftu === true);
            };

            service.hasJustUpdated = function () {
                const updated = getDataFromFile("/settings/justUpdated", false, false);
                return updated != null ? updated : false;
            };

            service.setJustUpdated = function (justUpdated) {
                pushDataToFile("/settings/justUpdated", justUpdated === true);
            };

            service.getOverlayVersion = function () {
                const version = getDataFromFile("/settings/copiedOverlayVersion", false, "");
                return version != null ? version : "";
            };

            service.setOverlayVersion = function (newVersion) {
                pushDataToFile("/settings/copiedOverlayVersion", newVersion.toString());
            };

            service.getWebServerPort = function () {
                const serverPort = getDataFromFile("/settings/webServerPort", false, 7472);
                return serverPort != null ? serverPort : 7472;
            };

            service.setWebServerPort = function (port) {
                // Ensure port is a number.
                if (!Number.isInteger(port)) {
                    return;
                }

                // Save to settings file for app front end
                pushDataToFile("/settings/webServerPort", port);

                const path = dataAccess.getPathInWorkingDir(
                    "/resources/overlay/js/port.js"
                );

                // Overwrite the 'port.js' file in the overlay settings folder with the new port
                fs.writeFile(path, `window.WEBSERVER_PORT = ${port}`, { encoding: "utf8" }, () => {
                    logger.info(`Set overlay port to: ${port}`);
                });
            };

            service.getWebSocketPort = function () {
                return service.getWebServerPort();
            };

            service.setWebSocketPort = function (port) {
                return service.setWebServerPort(port);
            };

            service.setInactiveTimer = function (inactiveTimer) {
                console.log(inactiveTimer);
            };

            service.showOverlayInfoModal = function (instanceName) {
                utilityService.showOverlayInfoModal(instanceName);
            };

            service.showOverlayEventsModal = function () {
                utilityService.showOverlayEventsModal();
            };

            service.getOverlayEventsSettings = function () {
                const settings = getDataFromFile("/settings/eventSettings", false, {});
                return settings != null ? settings : {};
            };

            service.saveOverlayEventsSettings = function (eventSettings) {
                pushDataToFile("/settings/eventSettings", eventSettings);
            };

            service.getClearCustomScriptCache = function () {
                const clear = getDataFromFile("/settings/clearCustomScriptCache", false, false);
                return clear != null ? clear : false;
            };

            service.setClearCustomScriptCache = function (clear) {
                pushDataToFile("/settings/clearCustomScriptCache", clear === true);
            };

            service.useOverlayInstances = function () {
                const oi = getDataFromFile("/settings/useOverlayInstances", false, false);
                return oi != null ? oi : false;
            };

            service.setUseOverlayInstances = function (oi) {
                pushDataToFile("/settings/useOverlayInstances", oi === true);
            };

            service.getOverlayInstances = function () {
                const ois = getDataFromFile("/settings/overlayInstances", false, []);
                return ois != null ? ois : [];
            };

            service.setOverlayInstances = function (ois) {
                pushDataToFile("/settings/overlayInstances", ois);
            };

            service.getForceOverlayEffectsToContinueOnRefresh = function () {
                const forceOverlayEffectsToContinueOnRefresh = getDataFromFile("/settings/forceOverlayEffectsToContinueOnRefresh", false, true);
                return forceOverlayEffectsToContinueOnRefresh === true;
            };

            service.setForceOverlayEffectsToContinueOnRefresh = function (value) {
                pushDataToFile("/settings/forceOverlayEffectsToContinueOnRefresh", value);
            };

            service.backupKeepAll = function () {
                const backupKeepAll = getDataFromFile("/settings/backupKeepAll", false, false);
                return backupKeepAll != null ? backupKeepAll : false;
            };

            service.setBackupKeepAll = function (backupKeepAll) {
                pushDataToFile("/settings/backupKeepAll", backupKeepAll === true);
            };

            service.backupOnExit = function () {
                const save = getDataFromFile("/settings/backupOnExit", false, true);
                return save != null ? save : true;
            };

            service.setBackupOnExit = function (backupOnExit) {
                pushDataToFile("/settings/backupOnExit", backupOnExit === true);
            };

            service.backupIgnoreResources = function () {
                const save = getDataFromFile("/settings/backupIgnoreResources", false, true);
                return save != null ? save : true;
            };

            service.setBackupIgnoreResources = function (backupIgnoreResources) {
                pushDataToFile("/settings/backupIgnoreResources", backupIgnoreResources === true);
            };

            service.backupBeforeUpdates = function () {
                const backupBeforeUpdates = getDataFromFile(
                    "/settings/backupBeforeUpdates", false, true
                );
                return backupBeforeUpdates != null ? backupBeforeUpdates : true;
            };

            service.setBackupBeforeUpdates = function (backupBeforeUpdates) {
                pushDataToFile(
                    "/settings/backupBeforeUpdates",
                    backupBeforeUpdates === true
                );
            };

            service.backupOnceADay = function () {
                const backupOnceADay = getDataFromFile("/settings/backupOnceADay", false, true);
                return backupOnceADay != null ? backupOnceADay : true;
            };

            service.setBackupOnceADay = function (backupOnceADay) {
                pushDataToFile("/settings/backupOnceADay", backupOnceADay === true);
            };

            service.maxBackupCount = function () {
                const maxBackupCount = getDataFromFile("/settings/maxBackupCount", false, 25);
                return maxBackupCount != null ? maxBackupCount : 25;
            };

            service.setMaxBackupCount = function (maxBackupCount) {
                pushDataToFile("/settings/maxBackupCount", maxBackupCount);
            };

            service.getAudioOutputDevice = function () {
                const defaultVal = { label: "System Default", deviceId: "default" };
                const device = getDataFromFile("/settings/audioOutputDevice", false, defaultVal);
                return device != null
                    ? device
                    : defaultVal;
            };

            service.setAudioOutputDevice = function (device) {
                pushDataToFile("/settings/audioOutputDevice", device);
            };

            service.getSidebarControlledServices = function () {
                const services = getDataFromFile("/settings/sidebarControlledServices", false, ["chat"]);
                return services != null
                    ? services
                    : ["chat"];
            };

            service.setSidebarControlledServices = function (services) {
                pushDataToFile("/settings/sidebarControlledServices", services);
            };

            service.getTaggedNotificationSound = function () {
                const sound = getDataFromFile("/settings/chat/tagged/sound");
                return sound != null ? sound : { name: "None" };
            };

            service.setTaggedNotificationSound = function (sound) {
                pushDataToFile("/settings/chat/tagged/sound", sound);
            };

            service.getTaggedNotificationVolume = function () {
                const volume = getDataFromFile("/settings/chat/tagged/volume");
                return volume != null ? volume : 5;
            };

            service.setTaggedNotificationVolume = function (volume) {
                pushDataToFile("/settings/chat/tagged/volume", volume);
            };

            service.debugModeEnabled = function () {
                const globalSettings = dataAccess.getJsonDbInUserData("/global-settings");
                let enabled;
                try {
                    enabled = globalSettings.getData("/settings/debugMode");
                } catch (err) { } //eslint-disable-line no-empty
                return enabled != null ? enabled : false;
            };

            service.setDebugModeEnabled = function (enabled) {
                const globalSettings = dataAccess.getJsonDbInUserData("/global-settings");
                try {
                    globalSettings.push("/settings/debugMode", enabled === true);
                } catch (err) { } //eslint-disable-line no-empty
            };

            service.getViewerColumnPreferences = function () {
                const prefs = getDataFromFile("/settings/viewerColumnPreferences", false, { lastSeen: true });
                return prefs != null ? prefs : { lastSeen: true };
            };

            service.setViewerColumnPreferences = function (prefs) {
                pushDataToFile("/settings/viewerColumnPreferences", prefs);
            };

            service.deleteFromViewerColumnPreferences = function (columnName) {
                deleteDataAtPath(`/settings/viewerColumnPreferences/${columnName}`);
            };

            service.getDefaultTtsVoiceId = function () {
                const id = getDataFromFile('/settings/defaultTtsVoiceId');
                return id;
            };

            service.setDefaultTtsVoiceId = function (id) {
                pushDataToFile('/settings/defaultTtsVoiceId', id);
            };

            service.getTtsVoiceVolume = function () {
                const volume = getDataFromFile('/settings/ttsVoiceVolume', false, 0.5);
                return volume !== undefined ? volume : 0.5;
            };

            service.setTtsVoiceVolume = function (volume) {
                pushDataToFile('/settings/ttsVoiceVolume', volume);
            };

            service.getTtsVoiceRate = function () {
                const rate = getDataFromFile('/settings/ttsVoiceRate', false, 1);
                return rate !== undefined ? rate : 1;
            };

            service.setTtsVoiceRate = function (rate) {
                pushDataToFile('/settings/ttsVoiceRate', rate);
            };


            service.getWhileLoopEnabled = function () {
                const enabled = getDataFromFile('/settings/whileLoopEnabled', false, false);
                return enabled !== undefined ? enabled : false;
            };

            service.setWhileLoopEnabled = function (enabled) {
                pushDataToFile('/settings/whileLoopEnabled', enabled === true);
            };

            service.getMinimizeToTray = function () {
                return getDataFromFile('/settings/minimizeToTray', false, false) === true;
            };
            service.setMinimizeToTray = function (minimizeToTray) {
                pushDataToFile('/settings/minimizeToTray', minimizeToTray === true);
            };

            service.getWebOnlineCheckin = () => {
                const webOnlineCheckin = getDataFromFile("/settings/webOnlineCheckin");
                return webOnlineCheckin === true;
            };

            service.setWebOnlineCheckin = (value) => {
                pushDataToFile("/settings/webOnlineCheckin", value);
            };

            service.getAllowCommandsInSharedChat = function () {
                return getDataFromFile("/settings/allowCommandsInSharedChat", false, false); // default OFF
            };

            service.setAllowCommandsInSharedChat = function (value) {
                pushDataToFile("/settings/allowCommandsInSharedChat", value);
            };

            return service;
        });
}());
