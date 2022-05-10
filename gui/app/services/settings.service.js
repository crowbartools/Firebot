"use strict";
(function() {
    //This handles settings access for frontend

    const fs = require("fs");
    const { ipcRenderer } = require("electron");

    angular
        .module("firebotApp")
        .factory("settingsService", function(utilityService, logger, profileManager, dataAccess, backendCommunicator) {
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
                } catch (err) {} //eslint-disable-line no-empty
            }

            function getDataFromFile(path, forceCacheUpdate) {
                try {
                    if (settingsCache[path] == null || forceCacheUpdate) {
                        const data = getSettingsFile().getData(path);
                        settingsCache[path] = data;
                    }
                } catch (err) {
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
                } catch (err) {} //eslint-disable-line no-empty
            }

            service.purgeSettingsCache = function() {
                settingsCache = {};
                backendCommunicator.fireEvent("purge-settings-cache");
            };

            service.getCustomScriptsEnabled = function() {
                return getDataFromFile("/settings/runCustomScripts") === true;
            };

            service.setCustomScriptsEnabled = function(enabled) {
                pushDataToFile("/settings/runCustomScripts", enabled === true);
            };

            service.getSidebarExpanded = function() {
                const expanded = getDataFromFile("/settings/sidebarExpanded");
                return expanded != null ? expanded : true;
            };

            service.setSidebarExpanded = function(expanded) {
                pushDataToFile("/settings/sidebarExpanded", expanded === true);
            };

            service.getDefaultToAdvancedCommandMode = function() {
                return getDataFromFile("/settings/defaultToAdvancedCommandMode") === true;
            };

            service.setDefaultToAdvancedCommandMode = function(defaultToAdvanced) {
                pushDataToFile("/settings/defaultToAdvancedCommandMode", defaultToAdvanced === true);
            };

            service.getSeenAdvancedCommandModePopup = function() {
                return getDataFromFile("/settings/seenAdvancedCommandModePopup") === true;
            };

            service.setSeenAdvancedCommandModePopup = function(seen) {
                pushDataToFile("/settings/seenAdvancedCommandModePopup", seen === true);
            };

            service.getPersistCustomVariables = function() {
                return getDataFromFile("/settings/persistCustomVariables") === true;
            };

            service.setPersistCustomVariables = function(enabled) {
                pushDataToFile("/settings/persistCustomVariables", enabled === true);
            };

            service.getAllowQuoteCSVDownloads = function() {
                return getDataFromFile("/settings/allowQuoteCSVDownloads") !== false;
            };

            service.setAllowQuoteCSVDownloads = function(enabled) {
                pushDataToFile("/settings/allowQuoteCSVDownloads", enabled === true);
            };

            service.legacySortTagsImported = function() {
                return getDataFromFile("/settings/legacySortTagsImported") === true;
            };

            service.setLegacySortTagsImported = function(enabled) {
                pushDataToFile("/settings/legacySortTagsImported", enabled === true);
            };

            service.getViewerListPageSize = function() {
                const viewerListPageSize = getDataFromFile("/settings/viewerListDatabase/pageSize");
                return viewerListPageSize != null ? viewerListPageSize : 10;
            };

            service.setViewerListPageSize = function(viewerListPageSize = 10) {
                pushDataToFile("/settings/viewerListDatabase/pageSize", viewerListPageSize);
            };

            service.isBetaTester = function() {
                const betaTester = getDataFromFile("/settings/beta");
                return betaTester != null ? betaTester : "No";
            };

            service.setBetaTester = function(isTester) {
                pushDataToFile("/settings/beta", isTester);
            };

            service.getEmulator = function() {
                const emulator = getDataFromFile("/settings/emulation");
                return emulator != null ? emulator : "Robotjs";
            };

            service.setEmulator = function(emulator) {
                pushDataToFile("/settings/emulation", emulator);
            };

            service.getViewerDB = function() {
                let viewerDB = getDataFromFile("/settings/viewerDB");

                // If viewerDB setting is not set, default to true to avoid future "cant find datapath" errors.
                if (viewerDB == null) {
                    logger.debug('Viewer DB setting not found. Defaulting to true.');
                    service.setViewerDB(true);
                    viewerDB = getDataFromFile("/settings/viewerDB");
                }
                return viewerDB != null ? viewerDB : true;
            };

            service.setViewerDB = function(status) {
                pushDataToFile("/settings/viewerDB", status);

                if (status === true) {
                    ipcRenderer.send("viewerDbConnect");
                } else {
                    ipcRenderer.send("viewerDbDisconnect");
                }
            };

            // Used for settings menu.
            service.getChatFeed = function() {
                const chatFeed = getDataFromFile("/settings/chatFeed");
                if (chatFeed === true) {
                    return "On";
                }
                return "Off";
            };

            // Used for the app itself.
            service.getRealChatFeed = function() {
                return true;
            };

            service.chatFeedEnabled = function() {
                return true;
            };

            service.setChatFeed = function() {};

            // Used for settings menu.
            service.getChatViewCount = function() {
                const chatViewCount = getDataFromFile("/settings/chatViewCount");
                if (chatViewCount === true) {
                    return "On";
                }
                return "Off";
            };

            service.setChatViewCount = function(chatViewCount) {
                pushDataToFile("/settings/chatViewCount", chatViewCount === true);
            };

            service.getViewerCount = function() {
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

            service.getShowChatViewerList = function() {
                const value = getDataFromFile("/settings/chatUsersList");
                return value == null ? true : value;
            };

            service.setShowChatViewerList = function(chatViewerList) {
                pushDataToFile("/settings/chatUsersList", chatViewerList === true);
            };

            service.showActivityFeed = function() {
                const show = getDataFromFile("/settings/activityFeed");
                return show == null ? true : show;
            };

            service.setShowActivityFeed = function(showActivityFeed) {
                pushDataToFile("/settings/activityFeed", showActivityFeed === true);
            };

            service.getAllowedActivityEvents = function() {
                const events = getDataFromFile("/settings/allowedActivityEvents");
                return events == null ? [
                    "twitch:host",
                    "twitch:raid",
                    "twitch:follow",
                    "twitch:sub",
                    "twitch:subs-gifted",
                    "twitch:community-subs-gifted",
                    "twitch:cheer",
                    "streamlabs:donation",
                    "streamlabs:eldonation",
                    "tipeeestream:donation",
                    "streamelements:donation",
                    "twitch:channel-reward-redemption"
                ] : events;
            };

            service.setAllowedActivityEvents = function(events) {
                if (events == null || !Array.isArray(events)) {
                    return;
                }
                pushDataToFile("/settings/allowedActivityEvents", events);
            };

            service.ignoreSubsequentSubEventsAfterCommunitySub = function() {
                const ignoreSubEvents = getDataFromFile("/settings/ignoreSubsequentSubEventsAfterCommunitySub");
                return ignoreSubEvents != null ? ignoreSubEvents : true;
            };

            service.setIgnoreSubsequentSubEventsAfterCommunitySub = function(ignoreSubEvents) {
                pushDataToFile("/settings/ignoreSubsequentSubEventsAfterCommunitySub", ignoreSubEvents === true);
            };

            service.getWysiwygBackground = function() {
                const bg = getDataFromFile("/settings/wysiwygBackground");
                return bg != null ? bg : 'white';
            };

            service.setWysiwygBackground = function(bg) {
                pushDataToFile("/settings/wysiwygBackground", bg);
            };

            service.getClearChatFeedMode = function() {
                const mode = getDataFromFile("/settings/clearChatFeedMode");
                return mode != null ? mode : 'onlyStreamer';
            };

            service.setClearChatFeedMode = function(mode) {
                pushDataToFile("/settings/clearChatFeedMode", mode);
            };

            service.isChatCompactMode = function() {
                const compact = getDataFromFile("/settings/chatCompactMode");
                return compact != null ? compact : false;
            };

            service.setChatCompactMode = function(compact) {
                pushDataToFile("/settings/chatCompactMode", compact === true);
            };

            service.getShowAvatars = function() {
                const value = getDataFromFile("/settings/chatAvatars");
                return value != null ? value : true;
            };
            service.setShowAvatars = function(value) {
                pushDataToFile("/settings/chatAvatars", value === true);
            };

            service.getShowTimestamps = function() {
                const value = getDataFromFile("/settings/chatTimestamps");
                return value != null ? value : true;
            };
            service.setShowTimestamps = function(value) {
                pushDataToFile("/settings/chatTimestamps", value === true);
            };

            service.getShowThirdPartyEmotes = function() {
                const value = getDataFromFile("/settings/chatThirdPartyEmotes");
                return value != null ? value : true;
            };

            service.getShowBttvEmotes = function() {
                const value = getDataFromFile("/settings/chat/emotes/bttv");
                return value != null ? value : service.getShowThirdPartyEmotes();
            };
            service.setShowBttvEmotes = function(value) {
                pushDataToFile("/settings/chat/emotes/bttv", value === true);
            };

            service.getShowFfzEmotes = function() {
                const value = getDataFromFile("/settings/chat/emotes/ffz");
                return value != null ? value : service.getShowThirdPartyEmotes();
            };
            service.setShowFfzEmotes = function(value) {
                pushDataToFile("/settings/chat/emotes/ffz", value === true);
            };

            service.getShowSevenTvEmotes = function() {
                const value = getDataFromFile("/settings/chat/emotes/seventv");
                return value != null ? value : service.getShowThirdPartyEmotes();
            };
            service.setShowSevenTvEmotes = function(value) {
                pushDataToFile("/settings/chat/emotes/seventv", value === true);
            };

            service.getShowPronouns = function() {
                const value = getDataFromFile("/settings/chatPronouns");
                return value != null ? value : true;
            };
            service.setShowPronouns = function(value) {
                pushDataToFile("/settings/chatPronouns", value === true);
            };

            service.getChatCustomFontSizeEnabled = function() {
                const value = getDataFromFile("/settings/chatCustomFontSizeEnabled");
                return value != null ? value : false;
            };
            service.setChatCustomFontSizeEnabled = function(value) {
                pushDataToFile("/settings/chatCustomFontSizeEnabled", value === true);
            };

            service.getChatCustomFontSize = function() {
                const value = getDataFromFile("/settings/chatCustomFontSize");
                return value != null ? value : 17;
            };
            service.setChatCustomFontSize = function(value) {
                pushDataToFile("/settings/chatCustomFontSize", value);
            };

            service.chatAlternateBackgrounds = function() {
                const alternate = getDataFromFile('/settings/chatAlternateBackgrounds');
                return alternate != null ? alternate : true;
            };

            service.setChatAlternateBackgrounds = function(alternate) {
                pushDataToFile('/settings/chatAlternateBackgrounds', alternate === true);
            };

            service.chatHideBotAccountMessages = function() {
                const shouldHide = getDataFromFile('/settings/chatHideBotAccountMessages');
                return shouldHide != null ? shouldHide : false;
            };

            service.setChatHideBotAccountMessages = function(shouldHide) {
                pushDataToFile('/settings/chatHideBotAccountMessages', shouldHide === true);
            };

            service.getShowUptimeStat = function() {
                const value = getDataFromFile("/settings/showUptimeStat");
                return value != null ? value : true;
            };
            service.setShowUptimeStat = function(value) {
                pushDataToFile("/settings/showUptimeStat", value === true);
            };
            service.getShowViewerCountStat = function() {
                const value = getDataFromFile("/settings/showViewerCountStat");
                return value != null ? value : true;
            };
            service.setShowViewerCountStat = function(value) {
                pushDataToFile("/settings/showViewerCountStat", value === true);
            };

            service.chatHideDeletedMessages = function() {
                const hide = getDataFromFile('/settings/chatHideDeletedMessages');
                return hide != null ? hide : false;
            };

            service.setChatHideDeletedMessages = function(hide) {
                pushDataToFile('/settings/chatHideDeletedMessages', hide === true);
            };

            service.getOverlayCompatibility = function() {
                const overlay = getDataFromFile("/settings/overlayImages");
                return overlay != null ? overlay : "Other";
            };

            service.setOverlayCompatibility = function(overlay) {
                const overlaySetting = overlay === "OBS" ? overlay : "Other";
                pushDataToFile("/settings/overlayImages", overlaySetting);
            };

            service.getTheme = function() {
                const theme = getDataFromFile("/settings/theme");
                return theme != null ? theme : "Obsidian";
            };

            service.setTheme = function(theme) {
                pushDataToFile("/settings/theme", theme);
            };

            service.soundsEnabled = function() {
                const sounds = getDataFromFile("/settings/sounds");
                return sounds != null ? sounds : "On";
            };

            service.setSoundsEnabled = function(enabled) {
                pushDataToFile("/settings/sounds", enabled);
            };

            service.getActiveChatUserListTimeout = function() {
                const inactiveTimer = getDataFromFile("/settings/activeChatUsers/inactiveTimer");
                return inactiveTimer != null ? parseInt(inactiveTimer) : 5;
            };

            service.setActiveChatUserListTimeout = function(inactiveTimer) {
                pushDataToFile("/settings/activeChatUsers/inactiveTimer", inactiveTimer);
            };

            /*
            * 0 = off,
            * 1 = bugfix,
            * 2 = feature,
            * 3 = major release,
            * 4 = betas
            */
            service.getAutoUpdateLevel = function() {
                const updateLevel = getDataFromFile("/settings/autoUpdateLevel");
                return updateLevel != null ? updateLevel : 2;
            };

            service.setAutoUpdateLevel = function(updateLevel) {
                pushDataToFile("/settings/autoUpdateLevel", updateLevel);
            };

            service.notifyOnBeta = function() {
                const beta = getDataFromFile("/settings/notifyOnBeta");
                return beta != null ? beta : false;
            };

            service.setNotifyOnBeta = function(beta) {
                pushDataToFile("/settings/notifyOnBeta", beta === true);
            };

            service.isFirstTimeUse = function() {
                const ftu = getDataFromFile("/settings/firstTimeUse");
                return ftu != null ? ftu : true;
            };

            service.setFirstTimeUse = function(ftu) {
                pushDataToFile("/settings/firstTimeUse", ftu === true);
            };

            service.hasJustUpdated = function() {
                const updated = getDataFromFile("/settings/justUpdated");
                return updated != null ? updated : false;
            };

            service.setJustUpdated = function(justUpdated) {
                pushDataToFile("/settings/justUpdated", justUpdated === true);
            };

            service.getOverlayVersion = function() {
                const version = getDataFromFile("/settings/copiedOverlayVersion");
                return version != null ? version : "";
            };

            service.setOverlayVersion = function(newVersion) {
                pushDataToFile("/settings/copiedOverlayVersion", newVersion.toString());
            };

            service.getWebServerPort = function() {
                const serverPort = getDataFromFile("/settings/webServerPort");
                return serverPort != null ? serverPort : 7472;
            };

            service.setWebServerPort = function(port) {
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
                fs.writeFile(path, `window.WEBSERVER_PORT = ${port}`, "utf8", () => {
                    logger.info(`Set overlay port to: ${port}`);
                });
            };

            service.getWebSocketPort = function() {
                return service.getWebServerPort();
            };

            service.setWebSocketPort = function(port) {
                return service.setWebServerPort(port);
            };

            service.setInactiveTimer = function(inactiveTimer) {
                console.log(inactiveTimer);
            };

            service.showOverlayInfoModal = function(instanceName) {
                utilityService.showOverlayInfoModal(instanceName);
            };

            service.showOverlayEventsModal = function() {
                utilityService.showOverlayEventsModal();
            };

            service.getOverlayEventsSettings = function() {
                const settings = getDataFromFile("/settings/eventSettings");
                return settings != null ? settings : {};
            };

            service.saveOverlayEventsSettings = function(eventSettings) {
                pushDataToFile("/settings/eventSettings", eventSettings);
            };

            service.getClearCustomScriptCache = function() {
                const clear = getDataFromFile("/settings/clearCustomScriptCache");
                return clear != null ? clear : false;
            };

            service.setClearCustomScriptCache = function(clear) {
                pushDataToFile("/settings/clearCustomScriptCache", clear === true);
            };

            service.useOverlayInstances = function() {
                const oi = getDataFromFile("/settings/useOverlayInstances");
                return oi != null ? oi : false;
            };

            service.setUseOverlayInstances = function(oi) {
                pushDataToFile("/settings/useOverlayInstances", oi === true);
            };

            service.getOverlayInstances = function() {
                const ois = getDataFromFile("/settings/overlayInstances");
                return ois != null ? ois : [];
            };

            service.setOverlayInstances = function(ois) {
                pushDataToFile("/settings/overlayInstances", ois);
            };

            service.backupKeepAll = function() {
                const backupKeepAll = getDataFromFile("/settings/backupKeepAll");
                return backupKeepAll != null ? backupKeepAll : false;
            };

            service.setBackupKeepAll = function(backupKeepAll) {
                pushDataToFile("/settings/backupKeepAll", backupKeepAll === true);
            };

            service.backupOnExit = function() {
                const save = getDataFromFile("/settings/backupOnExit");
                return save != null ? save : true;
            };

            service.setBackupOnExit = function(backupOnExit) {
                pushDataToFile("/settings/backupOnExit", backupOnExit === true);
            };

            service.backupBeforeUpdates = function() {
                const backupBeforeUpdates = getDataFromFile(
                    "/settings/backupBeforeUpdates"
                );
                return backupBeforeUpdates != null ? backupBeforeUpdates : true;
            };

            service.setBackupBeforeUpdates = function(backupBeforeUpdates) {
                pushDataToFile(
                    "/settings/backupBeforeUpdates",
                    backupBeforeUpdates === true
                );
            };

            service.backupOnceADay = function() {
                const backupOnceADay = getDataFromFile("/settings/backupOnceADay");
                return backupOnceADay != null ? backupOnceADay : true;
            };

            service.setBackupOnceADay = function(backupOnceADay) {
                pushDataToFile("/settings/backupOnceADay", backupOnceADay === true);
            };

            service.maxBackupCount = function() {
                const maxBackupCount = getDataFromFile("/settings/maxBackupCount");
                return maxBackupCount != null ? maxBackupCount : 25;
            };

            service.setMaxBackupCount = function(maxBackupCount) {
                pushDataToFile("/settings/maxBackupCount", maxBackupCount);
            };

            service.getAudioOutputDevice = function() {
                const device = getDataFromFile("/settings/audioOutputDevice");
                return device != null
                    ? device
                    : { label: "System Default", deviceId: "default" };
            };

            service.setAudioOutputDevice = function(device) {
                pushDataToFile("/settings/audioOutputDevice", device);
            };

            service.getSidebarControlledServices = function() {
                const services = getDataFromFile("/settings/sidebarControlledServices");
                return services != null
                    ? services
                    : ["chat"];
            };

            service.setSidebarControlledServices = function(services) {
                pushDataToFile("/settings/sidebarControlledServices", services);
            };

            service.getTaggedNotificationSound = function() {
                const sound = getDataFromFile("/settings/chat/tagged/sound");
                return sound != null ? sound : { name: "None" };
            };

            service.setTaggedNotificationSound = function(sound) {
                pushDataToFile("/settings/chat/tagged/sound", sound);
            };

            service.getTaggedNotificationVolume = function() {
                const volume = getDataFromFile("/settings/chat/tagged/volume");
                return volume != null ? volume : 5;
            };

            service.setTaggedNotificationVolume = function(volume) {
                pushDataToFile("/settings/chat/tagged/volume", volume);
            };

            service.debugModeEnabled = function() {
                const globalSettings = dataAccess.getJsonDbInUserData("/global-settings");
                let enabled;
                try {
                    enabled = globalSettings.getData("/settings/debugMode");
                } catch (err) {} //eslint-disable-line no-empty
                return enabled != null ? enabled : false;
            };

            service.setDebugModeEnabled = function(enabled) {
                const globalSettings = dataAccess.getJsonDbInUserData("/global-settings");
                try {
                    globalSettings.push("/settings/debugMode", enabled === true);
                } catch (err) {} //eslint-disable-line no-empty
            };

            service.getViewerColumnPreferences = function() {
                const prefs = getDataFromFile("/settings/viewerColumnPreferences");
                return prefs != null ? prefs : { lastSeen: true };
            };

            service.setViewerColumnPreferences = function(prefs) {
                pushDataToFile("/settings/viewerColumnPreferences", prefs);
            };

            service.deleteFromViewerColumnPreferences = function(columnName) {
                deleteDataAtPath("/settings/viewerColumnPreferences/" + columnName);
            };

            service.getDefaultTtsVoiceId = function() {
                const id = getDataFromFile('/settings/defaultTtsVoiceId');
                return id;
            };

            service.setDefaultTtsVoiceId = function(id) {
                pushDataToFile('/settings/defaultTtsVoiceId', id);
            };

            service.getTtsVoiceVolume = function() {
                const volume = getDataFromFile('/settings/ttsVoiceVolume');
                return volume !== undefined ? volume : 0.5;
            };

            service.setTtsVoiceVolume = function(volume) {
                pushDataToFile('/settings/ttsVoiceVolume', volume);
            };

            service.getTtsVoiceRate = function() {
                const rate = getDataFromFile('/settings/ttsVoiceRate');
                return rate !== undefined ? rate : 1;
            };

            service.setTtsVoiceRate = function(rate) {
                pushDataToFile('/settings/ttsVoiceRate', rate);
            };


            service.getWhileLoopEnabled = function() {
                const enabled = getDataFromFile('/settings/whileLoopEnabled');
                return enabled !== undefined ? enabled : false;
            };

            service.setWhileLoopEnabled = function(enabled) {
                pushDataToFile('/settings/whileLoopEnabled', enabled === true);
            };

            service.getMinimizeToTray = function () {
                return getDataFromFile('/settings/minimizeToTray') === true;
            };
            service.setMinimizeToTray = function (minimizeToTray) {
                pushDataToFile('/settings/minimizeToTray', minimizeToTray === true);
            };

            return service;
        });
}());
