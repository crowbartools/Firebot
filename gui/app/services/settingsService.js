'use strict';
(function() {

    //This handles settings access for frontend

    const dataAccess = require('../../lib/common/data-access.js');
    const fs = require('fs');

    angular
        .module('firebotApp')
        .factory('settingsService', function (utilityService, logger) {
            let service = {};

            let settingsCache = {};

            function getSettingsFile() {
                return dataAccess.getJsonDbInUserData("/user-settings/settings");
            }

            function pushDataToFile(path, data) {
                try {
                    getSettingsFile().push(path, data);
                    settingsCache[path] = data;
                } catch (err) {} //eslint-disable-line no-empty
            }

            function getDataFromFile(path, forceCacheUpdate) {
                try {
                    if (settingsCache[path] == null || forceCacheUpdate) {
                        let data = getSettingsFile().getData(path);
                        settingsCache[path] = data;
                    }
                } catch (err) {} //eslint-disable-line no-empty
                return settingsCache[path];
            }

            function deleteDataAtPath(path) {
                try {
                    getSettingsFile().delete(path);
                    delete settingsCache[path];
                } catch (err) {} //eslint-disable-line no-empty
            }

            service.purgeSettingsCache = function() {
                settingsCache = {};
            };

            service.getKnownBoards = function() {
                try {
                    // This feeds the boardService with known boards and their lastUpdated values.
                    let settingsDb = getSettingsFile();
                    let boards = settingsDb.getData('/boards');
                    return boards;
                } catch (err) {} //eslint-disable-line no-empty
            };

            service.deleteKnownBoard = function(boardId) {
                // This will delete a known board if provided a board id.
                try {
                    deleteDataAtPath('/boards/' + boardId);
                } catch (err) {
                    logger.info(err);
                }
            };

            service.getBoardLastUpdatedDatetimeById = function(id) {
                // Preparing for data from settings.json/boards/$boardId/lastUpdated
                let lastUpdatedDatetime = null;
                // Check if data is present for given board
                try {
                    lastUpdatedDatetime = getSettingsFile().getData(`/boards/${id}/lastUpdated`);
                } catch (err) {
                    logger.info("We encountered an error, most likely there are no boards in file so we need to build the boards and save them first", err);
                }
                return lastUpdatedDatetime;
            };

            service.setBoardLastUpdatedDatetimeById = function(boardId, boardName, boardDate) {
                // Building the board with ID and lastUpdated before pushing to settings
                let settingsBoard = {
                    boardId: boardId,
                    boardName: boardName,
                    lastUpdated: boardDate
                };
                pushDataToFile(`/boards/${boardId}`, settingsBoard);
            };

            function getLastBoardIdInternal() {
                let boardId = "";
                try {
                    boardId = getSettingsFile().getData('/interactive/lastBoardId');
                } catch (err) {
                    logger.info(err);
                }
                return boardId;
            }

            service.getLastBoardId = function() {
                let boardId = getLastBoardIdInternal();
                let knownBoards = service.getKnownBoards();

                let knownBoardId;
                if (knownBoards != null) {
                    knownBoardId = knownBoards[boardId] ? knownBoards[boardId].boardId : null;
                }

                // Check to see if the last selected board is on our "known boards" list.
                // If it's not, then pick a different board on our known boards list instead.
                if (knownBoardId == null) {

                    // Clear board from settings.
                    service.deleteLastBoardId();

                    // See if we have any other known boards.
                    if (knownBoards != null && knownBoards !== {}) {
                        let oldLastBoardName = service.getOldLastBoardName();
                        let newBoard = null;
                        if (oldLastBoardName != null) {
                            Object.keys(knownBoards).forEach(k => {
                                let b = knownBoards[k];
                                if (b != null && b.boardName === oldLastBoardName) {
                                    newBoard = k;
                                }
                            });
                            // we no longer need this badboy
                            deleteDataAtPath('/interactive/lastBoard');
                        }
                        if (newBoard == null) {
                            newBoard = Object.keys(knownBoards)[0];
                        }
                        service.setLastBoardId(newBoard);
                        boardId = newBoard;
                    } else {
                        boardId = null;
                    }
                }

                return boardId != null ? boardId : "";
            };

            service.setLastBoardId = function(id) {
                pushDataToFile('/interactive/lastBoardId', id);
            };

            service.deleteLastBoardId = function(boardId) {
                deleteDataAtPath('/interactive/lastBoardId');
                // Removing the board from settings
                deleteDataAtPath('/boards/' + boardId);
            };

            service.getOldLastBoardName = function() {
                return getDataFromFile('/interactive/lastBoard');
            };

            service.getCustomScriptsEnabled = function() {
                return getDataFromFile('/settings/runCustomScripts') === true;
            };

            service.setCustomScriptsEnabled = function(enabled) {
                pushDataToFile('/settings/runCustomScripts', enabled === true);
            };

            service.isBetaTester = function() {
                let betaTester = getDataFromFile('/settings/beta');
                return betaTester != null ? betaTester : "No";
            };

            service.setBetaTester = function(isTester) {
                pushDataToFile('/settings/beta', isTester);
            };

            service.getEmulator = function() {
                let emulator = getDataFromFile('/settings/emulation');
                return emulator != null ? emulator : "Robotjs";
            };

            service.setEmulator = function(emulator) {
                pushDataToFile('/settings/emulation', emulator);
            };

            // Used for settings menu.
            service.getChatFeed = function() {
                let chatFeed = getDataFromFile('/settings/chatFeed');
                if (chatFeed === true) {
                    return "On";
                }
                return "Off";
            };

            // Used for the app itself.
            service.getRealChatFeed = function() {
                return getDataFromFile('/settings/chatFeed');
            };

            service.chatFeedEnabled = function() {
                return getDataFromFile('/settings/chatFeed');
            };

            service.setChatFeed = function(chatFeed) {
                pushDataToFile('/settings/chatFeed', chatFeed === true);
            };

            // Used for settings menu.
            service.getChatViewCount = function() {
                let chatViewCount = getDataFromFile('/settings/chatViewCount');
                if (chatViewCount === true) {
                    return "On";
                }
                return "Off";
            };

            service.setChatViewCount = function(chatViewCount) {
                pushDataToFile('/settings/chatViewCount', chatViewCount === true);
            };

            service.showViewerCount = function() {
                return getDataFromFile('/settings/chatViewCount');
            };

            // Used for settings menu.
            service.getChatViewerList = function() {
                let chatViewerList = getDataFromFile('/settings/chatViewerList');
                if (chatViewerList === true) {
                    return "On";
                }
                return "Off";
            };

            service.showViewerList = function() {
                return getDataFromFile('/settings/chatViewerList');
            };

            service.setChatViewerList = function(chatViewerList) {
                pushDataToFile('/settings/chatViewerList', chatViewerList === true);
            };

            service.isChatCompactMode = function() {
                let compact = getDataFromFile('/settings/chatCompactMode');
                return compact != null ? compact : false;
            };

            service.setChatCompactMode = function(compact) {
                pushDataToFile('/settings/chatCompactMode', compact === true);
            };

            service.chatAlternateBackgrounds = function() {
                let alternate = getDataFromFile('/settings/chatAlternateBackgrounds');
                return alternate != null ? alternate : true;
            };

            service.setChatAlternateBackgrounds = function(alternate) {
                pushDataToFile('/settings/chatAlternateBackgrounds', alternate === true);
            };

            service.chatHideDeletedMessages = function() {
                let hide = getDataFromFile('/settings/chatHideDeletedMessages');
                return hide != null ? hide : false;
            };

            service.setChatHideDeletedMessages = function(hide) {
                pushDataToFile('/settings/chatHideDeletedMessages', hide === true);
            };

            service.getOverlayCompatibility = function() {
                let overlay = getDataFromFile('/settings/overlayImages');
                return overlay != null ? overlay : "Other";
            };

            service.setOverlayCompatibility = function(overlay) {
                let overlaySetting = overlay === 'OBS' ? overlay : 'Other';
                pushDataToFile('/settings/overlayImages', overlaySetting);
            };

            service.getTheme = function() {
                let theme = getDataFromFile('/settings/theme');
                return theme != null ? theme : "Light";
            };

            service.setTheme = function(theme) {
                pushDataToFile('/settings/theme', theme);
            };

            service.soundsEnabled = function() {
                let sounds = getDataFromFile('/settings/sounds');
                return sounds != null ? sounds : "On";
            };

            service.setSoundsEnabled = function(enabled) {
                pushDataToFile('/settings/sounds', enabled);
            };

            /*
            * 0 = off,
            * 1 = bugfix,
            * 2 = feature,
            * 3 = major release,
            * 4 = betas
            */
            service.getAutoUpdateLevel = function() {
                let updateLevel = getDataFromFile('/settings/autoUpdateLevel');
                return updateLevel != null ? updateLevel : 2;
            };

            service.setAutoUpdateLevel = function(updateLevel) {
                pushDataToFile('/settings/autoUpdateLevel', updateLevel);
            };

            service.notifyOnBeta = function() {
                let beta = getDataFromFile('/settings/notifyOnBeta');
                return beta != null ? beta : false;
            };

            service.setNotifyOnBeta = function(beta) {
                pushDataToFile('/settings/notifyOnBeta', beta === true);
            };

            service.isFirstTimeUse = function() {
                let ftu = getDataFromFile('/settings/firstTimeUse');
                return ftu != null ? ftu : true;
            };

            service.setFirstTimeUse = function(ftu) {
                pushDataToFile('/settings/firstTimeUse', ftu === true);
            };

            service.hasJustUpdated = function() {
                let updated = getDataFromFile('/settings/justUpdated');
                return updated != null ? updated : false;
            };

            service.setJustUpdated = function(justUpdated) {
                pushDataToFile('/settings/justUpdated', justUpdated === true);
            };

            service.getButtonViewMode = function(type) {
                if (type === "commands") {
                    let buttonViewMode = getDataFromFile('/settings/buttonViewModeCommands');
                    return buttonViewMode != null ? buttonViewMode : 'list';
                }
                let buttonViewMode = getDataFromFile('/settings/buttonViewMode');
                return buttonViewMode != null ? buttonViewMode : 'grid';

            };

            service.setButtonViewMode = function(buttonViewMode, type) {
                if (type === "commands") {
                    pushDataToFile('/settings/buttonViewModeCommands', buttonViewMode);
                } else {
                    pushDataToFile('/settings/buttonViewMode', buttonViewMode);
                }
            };

            service.getOverlayVersion = function() {
                let version = getDataFromFile('/settings/copiedOverlayVersion');
                return version != null ? version : "";
            };

            service.setOverlayVersion = function(newVersion) {
                pushDataToFile('/settings/copiedOverlayVersion', newVersion.toString());
            };

            service.getWebServerPort = function() {
                let serverPort = getDataFromFile('/settings/webServerPort');
                return serverPort != null ? serverPort : 7473;
            };

            service.getWebSocketPort = function() {
                let websocketPort = getDataFromFile('/settings/websocketPort');
                return websocketPort != null ? websocketPort : 8080;
            };

            service.setWebSocketPort = function(port) {
                // Ensure port is a number.
                if (!Number.isInteger(port)) {
                    return;
                }

                // Save to settings file for app front end
                pushDataToFile('/settings/websocketPort', port);

                let path = dataAccess.getPathInWorkingDir("/resources/overlay/js/port.js");

                // Overwrite the 'port.js' file in the overlay settings folder with the new port
                fs.writeFile(path, `window.WEBSOCKET_PORT = ${port}`,
                    'utf8', () => {
                        logger.info(`Set overlay port to: ${port}`);
                    });
            };

            service.showOverlayInfoModal = function(instanceName) {
                utilityService.showOverlayInfoModal(instanceName);
            };

            service.showOverlayEventsModal = function() {
                utilityService.showOverlayEventsModal();
            };

            service.getOverlayEventsSettings = function() {
                let settings = getDataFromFile('/settings/eventSettings');
                return settings != null ? settings : {};
            };

            service.saveOverlayEventsSettings = function(eventSettings) {
                pushDataToFile('/settings/eventSettings', eventSettings);
            };

            service.getClearCustomScriptCache = function() {
                let clear = getDataFromFile('/settings/clearCustomScriptCache');
                return clear != null ? clear : false;
            };

            service.setClearCustomScriptCache = function(clear) {
                pushDataToFile('/settings/clearCustomScriptCache', clear === true);
            };

            service.useOverlayInstances = function() {
                let oi = getDataFromFile('/settings/useOverlayInstances');
                return oi != null ? oi : false;
            };

            service.setUseOverlayInstances = function(oi) {
                pushDataToFile('/settings/useOverlayInstances', oi === true);
            };

            service.getOverlayInstances = function() {
                let ois = getDataFromFile('/settings/overlayInstances');
                return ois != null ? ois : [];
            };

            service.setOverlayInstances = function(ois) {
                pushDataToFile('/settings/overlayInstances', ois);
            };

            service.backupKeepAll = function() {
                let backupKeepAll = getDataFromFile('/settings/backupKeepAll');
                return backupKeepAll != null ? backupKeepAll : false;
            };

            service.setBackupKeepAll = function(backupKeepAll) {
                pushDataToFile('/settings/backupKeepAll', backupKeepAll === true);
            };

            service.backupOnExit = function() {
                let save = getDataFromFile('/settings/backupOnExit');
                return save != null ? save : true;
            };

            service.setBackupOnExit = function(backupOnExit) {
                pushDataToFile('/settings/backupOnExit', backupOnExit === true);
            };

            service.backupBeforeUpdates = function() {
                let backupBeforeUpdates = getDataFromFile('/settings/backupBeforeUpdates');
                return backupBeforeUpdates != null ? backupBeforeUpdates : true;
            };

            service.setBackupBeforeUpdates = function(backupBeforeUpdates) {
                pushDataToFile('/settings/backupBeforeUpdates', backupBeforeUpdates === true);
            };

            service.backupOnceADay = function() {
                let backupOnceADay = getDataFromFile('/settings/backupOnceADay');
                return backupOnceADay != null ? backupOnceADay : true;
            };

            service.setBackupOnceADay = function(backupOnceADay) {
                pushDataToFile('/settings/backupOnceADay', backupOnceADay === true);
            };

            service.maxBackupCount = function() {
                let maxBackupCount = getDataFromFile('/settings/maxBackupCount');
                return maxBackupCount != null ? maxBackupCount : 25;
            };

            service.setMaxBackupCount = function(maxBackupCount) {
                pushDataToFile('/settings/maxBackupCount', maxBackupCount);
            };

            service.getClipDownloadFolder = function() {
                let dlFolder = getDataFromFile('/settings/clips/downloadFolder');
                return dlFolder != null && dlFolder !== "" ? dlFolder : dataAccess.getPathInUserData("/clips/");
            };

            service.setClipDownloadFolder = function(filepath) {
                pushDataToFile('/settings/clips/downloadFolder', filepath);
            };

            service.getAudioOutputDevice = function() {
                let device = getDataFromFile('/settings/audioOutputDevice');
                return device != null ? device : { label: "System Default", deviceId: "default"};
            };

            service.setAudioOutputDevice = function(device) {
                pushDataToFile('/settings/audioOutputDevice', device);
            };

            service.getSidebarControlledServices = function() {
                let services = getDataFromFile('/settings/sidebarControlledServices');
                return services != null ? services : ['interactive', 'chat', 'constellation'];
            };

            service.setSidebarControlledServices = function(services) {
                pushDataToFile('/settings/sidebarControlledServices', services);
            };

            service.getTaggedNotificationSound = function() {
                let sound = getDataFromFile('/settings/chat/tagged/sound');
                return sound != null ? sound : { name: "None" };
            };

            service.setTaggedNotificationSound = function(sound) {
                pushDataToFile('/settings/chat/tagged/sound', sound);
            };

            service.getTaggedNotificationVolume = function() {
                let volume = getDataFromFile('/settings/chat/tagged/volume');
                return volume != null ? volume : 5;
            };

            service.setTaggedNotificationVolume = function(volume) {
                pushDataToFile('/settings/chat/tagged/volume', volume);
            };

            service.debugModeEnabled = function() {
                let enabled = getDataFromFile('/settings/debugMode');
                return enabled != null ? enabled : false;
            };

            service.setDebugModeEnabled = function(enabled) {
                pushDataToFile('/settings/debugMode', enabled === true);
            };

            return service;
        });
}());
