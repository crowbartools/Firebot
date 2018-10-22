'use strict';
(function() {

    //This manages board data

    const fs = require('fs');
    const _ = require('underscore')._;
    const dataAccess = require('../../lib/common/data-access.js');

    angular
        .module('firebotApp')
        .factory('boardService', function (logger, $http, $q, settingsService, $rootScope, utilityService) {

            // in memory board storage
            let _boards = {};

            // factory/service object
            let service = {};

            let selectedBoard = {};

            let isloadingBoards = false;

            /**
            *  Private helper methods
            */

            // Emoji checker!
            // This checks a string for emoji and returns true if there are any...
            function isEmoji(str) {
                let ranges = [
                    '\ud83c[\udf00-\udfff]', // U+1F300 to U+1F3FF
                    '\ud83d[\udc00-\ude4f]', // U+1F400 to U+1F64F
                    '\ud83d[\ude80-\udeff]' // U+1F680 to U+1F6FF
                ];
                if (str.match(ranges.join('|'))) {
                    return true;
                }
                return false;

            }

            // Delete Board
            // This deletes the currently selected board on confirmation.
            function deleteBoard(boardId) {
                return $q.when(new Promise((resolve) => {

                    // Check for last board and load ui if one exists.
                    try {
                        let filepath = dataAccess.getPathInUserData('/user-settings/controls/' + boardId + '.json');

                        let exists = fs.existsSync(filepath);
                        if (exists) {
                            // File exists deleting
                            fs.unlink(filepath, function() {
                                resolve();
                            });
                        } else {
                            renderWindow.webContents.send('error', "Well this is weird. The board you tried to delete is already gone. Try restarting the app.");
                            resolve();
                        }
                    } catch (err) {
                        resolve();
                    }
                }));
            }

            // Backend Cleanup
            // This takes the mixer json and compares it against the Firebot json to remove any items no longer needed.
            function backendCleanup(dbControls) {
                return new Promise((resolve) => {
                    logger.info('Backend Cleanup: Checking for differences between mixer and firebot boards.');

                    // Check if Firebot settings exist
                    let mixerSettings, firebotSettings;
                    try {
                        // We have saved settings. Time to clean up!
                        mixerSettings = dbControls.getData('./mixer');
                        firebotSettings = dbControls.getData('./firebot');

                    } catch (err) {
                        // We don't have any saved settings yet. Resolve this and don't cleanup anything.
                        logger.info("It doesnt appear that we have previously saved settings, skipping board cleanup");
                        resolve(true);
                        return;
                    }


                    // Make an array containing all of the buttons and scenes from each json so we can compare.
                    let mixerButtonArray = [];
                    let firebotButtonArray = [];
                    let mixerJoysticks = [];
                    let mixerSceneArray = [];
                    let firebotSceneArray = [];

                    // Add mixer stuff to mixer arrays for comparison.
                    for (let scene of mixerSettings) {
                        // Save Scenes
                        let sceneID = scene.sceneID;
                        mixerSceneArray.push(sceneID);

                        // Save Buttons
                        let controls = scene.controls;
                        for (let control of controls) {
                            let controlID = control.controlID;
                            if (control.type === 'joystick') {
                                mixerJoysticks.push(controlID);
                            } else {
                                mixerButtonArray.push(controlID);
                            }
                        }
                    }

                    // Add Firebot scenes to firebot array.
                    for (let scene in firebotSettings.scenes) {
                        if (scene != null) {
                            firebotSceneArray.push(scene);
                        }
                    }

                    // Add Firebot buttons to firebot array for comparison.
                    for (let control in firebotSettings.controls) {
                        if (control != null) {
                            firebotButtonArray.push(control);
                        }
                    }

                    // add firebot joystick ids
                    if (firebotSettings.joysticks) {
                        let firebotJoysticks = Object.keys(firebotSettings.joysticks);

                        // filter to deleted joysticks
                        let deletedJoysticks = firebotJoysticks.filter(id => !mixerJoysticks.includes(id));

                        // delete deleted joysticks from file
                        deletedJoysticks.forEach(joystickId => {
                            try {
                                dbControls.delete('./firebot/joysticks/' + joystickId);
                                logger.info('Joystick ' + joystickId + ' is not on the mixer board. Deleting.');

                            } catch (err) {
                                logger.error(err);
                            }
                        });
                    }

                    // Filter out all buttons that match. Anything left in the firebotButtonArray no longer exists on the mixer board.
                    firebotButtonArray = firebotButtonArray.filter(val => !mixerButtonArray.includes(val));

                    // Filter out all scenes that match. Anything left in the firebotScenenArray no longer exists on the mixer board.
                    firebotSceneArray = firebotSceneArray.filter(val => !mixerSceneArray.includes(val));

                    // Remove buttons that are no longer needed.
                    // If a scene was deleted from Mixer, the buttons for that scene should be gone as well.
                    for (let button of firebotButtonArray) {
                        try {
                            if (button === "") {
                                utilityService.showErrorModal("Detected a button with a name that shouldnt be possible and could cause issues. Please reach out to the Firebot Dev team for help (Click the About link in the sidebar to find our Discord).");
                                continue;
                            }
                            dbControls.delete('./firebot/controls/' + button);
                            logger.info('Button ' + button + ' is not on the mixer board. Deleting.');

                            // Go through cooldown groups and remove the button if it is listed there.
                            for (let cooldown in firebotSettings.cooldownGroups) {
                                if (firebotSettings.cooldownGroups.hasOwnProperty(cooldown)) {
                                    let cooldownButtons = dbControls.getData('./firebot/cooldownGroups/' + cooldown + '/buttons');
                                    let i = cooldownButtons.length;
                                    while (i--) {
                                        if (cooldownButtons[i] === button) {
                                            cooldownButtons.splice(i, 1);
                                            logger.info('Removing ' + button + ' from cooldown group ' + cooldown + '.');
                                            break;
                                        }
                                    }

                                    // Push corrected cooldown array to db.
                                    dbControls.push('./firebot/cooldownGroups/' + cooldown + '/buttons', cooldownButtons);
                                }
                            }
                        } catch (err) {
                            logger.error(err);
                        }
                    }

                    // Remove scenes that are no longer needed.
                    for (let scene of firebotSceneArray) {
                        try {
                            dbControls.delete('./firebot/scenes/' + scene);
                            logger.info('Scene ' + scene + ' is not on the mixer board. Deleting from firebot.');
                        } catch (err) {
                            logger.error(err);
                        }
                    }

                    logger.info('Backend Cleanup: Completed.');
                    resolve(true);
                });
            }

            // Backend Controls Builder
            // This takes the mixer json and builds out the structure for the controls file.
            function backendBuilder(gameNameId, gameJsonInfo, gameUpdatedInfo, versionIdInfo, utilityService) {
                const gameName = gameNameId;
                const gameJson = gameJsonInfo;
                const gameUpdated = gameUpdatedInfo;
                const versionid = versionIdInfo;

                logger.info('Backend builder is pushing settings to ' + gameName + ' (' + versionid + ').');

                // Pushing boardid: ${versionIdInfo} with ${gameUpdatedInfo} to settings/boards
                settingsService.setBoardLastUpdatedDatetimeById(versionIdInfo, gameName, gameUpdated);

                // If file is still based on game name, convert the filename to versionid format. This bit of code will be obsolete in a few versions.
                if (dataAccess.userDataPathExistsSync('/user-settings/controls/' + gameName + '.json')) {
                    if (!dataAccess.userDataPathExistsSync('/user-settings/controls/' + versionid + '.json')) {
                        logger.info('Converting control files to new versionid format.');
                        let oldPath = dataAccess.getPathInUserData("/user-settings/controls/" + gameName + '.json');
                        let newPath = dataAccess.getPathInUserData("/user-settings/controls/" + versionid + '.json');

                        try {
                            fs.renameSync(oldPath, newPath);
                            logger.info('Converted control file ' + gameName + '.json to version id format.');
                        } catch (err) {
                            logger.error(err);
                            utilityService.showErrorModal("Unable to convert controls file " + gameName + ".json to new format. Do you have the file open somewhere? If so, close it down and restart Firebot.");
                            return;
                        }
                    } else {
                        logger.info("We detected a control file still using the board name, but it looks like it has already been converted so we will ignore it.");
                    }
                }

                let dbControls = dataAccess.getJsonDbInUserData("/user-settings/controls/" + versionid);

                // Push mixer Json to controls file.
                dbControls.push('/gameName', gameName);
                dbControls.push('/versionid', parseInt(versionid));
                dbControls.push('/mixer', gameJson);

                // Cleanup Firebot Controls
                return backendCleanup(dbControls)
                    .then(() => {
                        let controlID,
                            sceneName,
                            sceneControls,
                            emojiTest,
                            button,
                            text,
                            cost,
                            joystick,
                            type;

                        // Build Firebot controls
                        for (let i = 0; i < gameJson.length; i++) {
                            sceneName = gameJson[i].sceneID;
                            sceneControls = gameJson[i].controls;

                            // Loop through controls for this scene.
                            for (let a = 0; a < sceneControls.length; a++) {
                                button = sceneControls[a];

                                if (button.controlID.includes("/")) {
                                    utilityService.showErrorModal(`A control with the id of '${button.controlID}' contains a forwardslash which can cause major issues. Please rename the control to remove the / from the name. Sorry for the inconvienence.`);
                                    continue;
                                }

                                // Try to get info for button. If there is nothing it errors out.
                                try {
                                    type = button.kind;
                                    if (type === "button") {
                                        try {
                                            emojiTest = isEmoji(button.controlID);
                                            if (emojiTest === false) {
                                                controlID = button.controlID;
                                            } else {
                                                utilityService.showErrorModal("Button: " + button.controlID + " has emoji in the button name. This will cause all buttons to become unresponsive on connecting. Please remove emoji from the button name field in the Mixer studio. Note that button text is what is visible to viewers, and it's fine to have emoji there.");
                                            }
                                        } catch (ignore) {} //eslint-disable-line no-empty

                                        text = button.text || "None";
                                        cost = button.cost || 0;

                                        // Push to database
                                        /*
                                        // There is a reason for this one; Don't do it in a whole block
                                        // it will rewrite all custom actions even if you just change the spark cost on Mixer Studio
                                        // If we figure out a way to load the whole block, swap the new changes from mixer and save
                                        // it back in without altering custom actions then we can swap this for a whole push instead
                                        // of a singular one (Perry - 2017-06-28)
                                        */
                                        dbControls.push('./firebot/controls/' + controlID + '/controlId', controlID);
                                        dbControls.push('./firebot/controls/' + controlID + '/scene', sceneName);
                                        dbControls.push('./firebot/controls/' + controlID + '/text', text);
                                        dbControls.push('./firebot/controls/' + controlID + '/cost', cost);
                                        dbControls.push('./firebot/controls/' + controlID + '/kind', type);
                                        dbControls.push('./firebot/controls/' + controlID + '/meta', button.meta);
                                        dbControls.push('./firebot/controls/' + controlID + '/tooltip', button.tooltip);
                                    }

                                    if (type === "label") {
                                        let controlID = button.controlID;
                                        dbControls.push('./firebot/controls/' + controlID + '/kind', type);
                                        dbControls.push('./firebot/controls/' + controlID + '/controlId', controlID);
                                        dbControls.push('./firebot/controls/' + controlID + '/scene', sceneName);
                                        dbControls.push('./firebot/controls/' + controlID + '/text', button.text);
                                    }

                                    if (type === "textbox") {
                                        let controlID = button.controlID;
                                        dbControls.push('./firebot/controls/' + controlID + '/kind', type);
                                        dbControls.push('./firebot/controls/' + controlID + '/controlId', button.controlID);
                                        dbControls.push('./firebot/controls/' + controlID + '/scene', sceneName);
                                        dbControls.push('./firebot/controls/' + controlID + '/multiline', button.multiline);
                                        dbControls.push('./firebot/controls/' + controlID + '/hasSubmit', button.hasSubmit);
                                        dbControls.push('./firebot/controls/' + controlID + '/placeholder', button.placeholder);
                                    }


                                    if (type === "joystick") {
                                        joystick = {
                                            controlID: button.controlID,
                                            sampleRate: button.sampleRate,
                                            scene: sceneName,
                                            kind: type
                                        };
                                        dbControls.push(`./firebot/joysticks/${joystick.controlID}`, joystick);
                                    }

                                } catch (err) {
                                    logger.error('Problem getting button info to save to json.', err);
                                }
                            }

                            // Setup scenes in Firebot json if they haven't been made yet.
                            if (sceneName.includes("/")) {
                                utilityService.showErrorModal("Scene: '" + sceneName + "' contains a forward slash (/) in it's name which can cause errors when connecting to Interactive. It is recommended that you rename your scene to use an & or + instead and resync with Firebot.");
                            }
                            try {
                                dbControls.getData('./firebot/scenes/' + sceneName);
                            } catch (err) {
                                dbControls.push('./firebot/scenes/' + sceneName + '/sceneName', sceneName);
                                if (sceneName !== "default") {
                                    dbControls.push('./firebot/scenes/' + sceneName + '/default', ["None"]);
                                } else {
                                    dbControls.push('./firebot/scenes/' + sceneName + '/default', []);
                                }
                            }
                        }
                    });
            }

            function loadBoardById(id, forceSync = false) {
                logger.info(`Getting ${id} from Mixer...`);
                return $http.get("https://mixer.com/api/v1/interactive/versions/" + id)
                    .then(function(response) {

                        let data = response.data;

                        logger.info(`Got ${id} from Mixer!`);

                        if (data.controlVersion === "1.0") {
                            utilityService.showErrorModal("The board you're trying to load was created using Mixer Interactive v1. Please create a new board using Mixer Interactive v2.");
                            return false;
                        }

                        if (data.id !== null && data.game == null) {
                            service.deleteBoardById(id);
                            utilityService.showErrorModal(`The board (${id}) has been deleted on the Mixer Dev Lab. It has been automatically removed from Firebot.`);
                            return false;
                        }

                        try {
                            let gameUpdated = data.updatedAt;
                            let gameName = data.game.name;
                            let gameJson = data.controls.scenes;
                            let boardUpdated = null; // Prepare for data from settings/boards/boardId

                            try { // Checking if the data for this board is present in settings.json
                                boardUpdated = settingsService.getBoardLastUpdatedDatetimeById(id);

                                // If id is in settings, check to see if the actual file exists.
                                if (boardUpdated != null) {
                                    let boardExists = dataAccess.userDataPathExistsSync("/user-settings/controls/" + id + ".json");
                                    if (!boardExists) {
                                        logger.info('Board was in settings, but the controls file is missing. Rebuilding.');
                                        return backendBuilder(gameName, gameJson, gameUpdated, id, utilityService).then(() => {
                                            return id;
                                        });
                                    }
                                }

                                // If the board is up to date, OR if the file exists under the game name then run the backend builder.
                                if (boardUpdated !== gameUpdated || forceSync) {
                                    logger.info('Board updated. Rebuilding.');
                                    return backendBuilder(gameName, gameJson, gameUpdated, id, utilityService).then(() => {
                                        return id;
                                    });
                                } // Date matches, no need to rebuild.

                            } catch (err) {
                                logger.warn(err);
                                // This board doesn't exist, recreate the board to get it into knownBoards
                                logger.log(`Error occured, not able to find boardid ${id} in settings, build it`);
                                return backendBuilder(gameName, gameJson, gameUpdated, id, utilityService).then(() => {
                                    return id;
                                });
                            }
                        } catch (err) {
                            logger.warn('There was a problem loading this board!');
                            logger.error(err);
                            return false;
                        }
                        return id;
                    }, function(response) {
                        logger.info("Error getting board");
                        logger.info(response);
                        return false;
                    });
            }

            function loadBoardsById(boardVersionIds, clearPreviousBoards, forceSync = false) {

                //create a list of board load promises
                logger.debug("Create list of board promises...");
                let boardLoadPromises = [];
                _.each(boardVersionIds, function(id) {
                    logger.debug("Loading board " + id);
                    let promise = loadBoardById(id, forceSync);
                    boardLoadPromises.push(promise);
                });

                //return a promise that will be resolved once all other promises have completed
                return Promise.all(boardLoadPromises).then((loadedIds) => {
                    logger.info("All boards synced to mixer");
                    //clear out previously loaded boards
                    if (clearPreviousBoards === true) {
                        _boards = {};
                    }

                    let addedBoards = [];
                    // load each board
                    _.each(loadedIds, function (id) {
                        if (id === false) return;
                        let boardDb = dataAccess.getJsonDbInUserData("/user-settings/controls/" + id);
                        let boardData = boardDb.getData('/');
                        try {
                            let board = boardData.firebot;
                            let versionId = board["versionId"] = boardData.versionid;
                            board["name"] = boardData.gameName;
                            board["versionid"] = boardData.versionid;
                            board['controls'] = boardData.firebot.controls || {};
                            board.getControlsForScene = function(sceneId) {
                                return _.where(this.controls, {scene: sceneId});
                            };
                            board['joysticks'] = boardData.firebot.joysticks || {};
                            board.getJoysticksForScene = function(sceneId) {
                                return _.where(this.joysticks, {scene: sceneId});
                            };
                            _boards[versionId] = board;
                            addedBoards.push(board);
                        } catch (err) {
                            logger.error('Board ' + id + ' errored out while trying to load.' + err);

                            // Remove the corrupted board from settings so we don't get stuck on next restart.
                            //loadBoardById(id);
                        }
                    });

                    return $q.resolve(true, () => {
                        $rootScope.showSpinner = false;
                        return addedBoards;
                    });
                }, (error) => {
                    logger.warn(error);
                    $rootScope.showSpinner = false;
                    return $q.reject(error);
                });
            }

            /**
            * Public methods
            */
            service.hasBoardsLoaded = function() {
                return _.keys(_boards).length > 0;
            };

            // Returns an array of the in-memory boards
            service.getAllBoards = function() {
                return _.values(_boards);
            };

            // Returns an array of names for the loaded boards
            service.getBoardNames = function() {
                let names = _.pluck(_boards, 'name');
                return names;
            };

            service.getBoardById = function(id) {
                return _boards[id];
            };

            service.getBoardByName = function(name) {
                return _.findWhere(_boards, {name: name});
            };

            service.getLastUsedBoard = function () {
                return service.getBoardById(settingsService.getLastBoardId());
            };

            service.getSelectedBoard = function() {
                return selectedBoard;
            };

            service.setSelectedBoard = function(board) {
                if (board != null && board.versionid != null) {
                    settingsService.setLastBoardId(board.versionid);
                }
                selectedBoard = board;

                // Refresh the interactive control cache.
                ipcRenderer.send('refreshInteractiveCache');
            };

            service.loadBoardWithId = function(id, forceSync = false) {
                $rootScope.showSpinner = true;
                return loadBoardsById([id], false, forceSync).then((boards) => {
                    let board = service.getBoardById(id);
                    if (board != null) {
                        service.setSelectedBoard(board);
                    }
                    return $q.resolve(true, () => {
                        return boards;
                    });
                });
            };

            service.deleteBoardById = function(id) {
                let isCurrentBoard = settingsService.getLastBoardId() == id; //eslint-disable-line

                return deleteBoard(id).then(() => {

                    // Remove last board setting entry
                    settingsService.deleteKnownBoard(id);

                    delete _boards[id];

                    if (isCurrentBoard) {
                        let remainingBoards = Object.keys(_boards);

                        if (remainingBoards.length < 1) {
                            service.setSelectedBoard(null);
                        } else {
                            let key = remainingBoards[0];
                            service.setSelectedBoard(_boards[key]);
                        }
                    }

                });
            };

            service.deleteCurrentBoard = function() {
                let currentBoardId = service.getSelectedBoard().versionid;

                return deleteBoard(currentBoardId).then(() => {

                    // Remove last board setting entry
                    settingsService.deleteLastBoardId(currentBoardId);

                    delete _boards[currentBoardId];

                    let remainingBoards = Object.keys(_boards);

                    if (remainingBoards.length < 1) {
                        service.setSelectedBoard(null);
                    } else {
                        let key = remainingBoards[0];
                        service.setSelectedBoard(_boards[key]);
                    }

                });
            };

            service.isloadingBoards = function() {
                return isloadingBoards;
            };

            // reload boards into memory
            service.loadAllBoards = function() {
                logger.info("Attempting to load all boards...");
                isloadingBoards = true;

                let knownBoards, boardVersionIds;

                /* Step 1 */
                // Get a list or board ids so we can resync them all with Mixer
                knownBoards = settingsService.getKnownBoards();

                if (knownBoards !== null && knownBoards !== undefined) {
                    boardVersionIds = [];
                    _.each(knownBoards, function(board) {
                        boardVersionIds.push(board.boardId);
                    });

                    logger.debug("Loading boards: " + boardVersionIds ? boardVersionIds.join(", ") : "No boards found");
                    /* Step 2 */
                    // Load each board.
                    return loadBoardsById(boardVersionIds, true).then(() => {
                        isloadingBoards = false;
                        selectedBoard = service.getLastUsedBoard();
                    });
                }

                isloadingBoards = false;
                return Promise.resolve();
            };

            service.saveControlForCurrentBoard = function(control) {
                let boardDb = dataAccess.getJsonDbInUserData("/user-settings/controls/" + settingsService.getLastBoardId());

                // Note(ebiggz): Angular sometimes adds properties to objects for the purposes of two way bindings
                // and other magical things. Angular has a .toJson() convienence method that coverts an object to a json string
                // while removing internal angular properties. We then convert this string back to an object with
                // JSON.parse. It's kinda hacky, but it's an easy way to ensure we arn't accidentally saving anything extra.
                let cleanedControl = JSON.parse(angular.toJson(control));

                boardDb.push("./firebot/controls/" + control.controlId, cleanedControl);

                // Refresh the interactive control cache.
                ipcRenderer.send('refreshInteractiveCache');
            };

            service.saveSceneForCurrentBoard = function(scene) {
                let boardDb = dataAccess.getJsonDbInUserData("/user-settings/controls/" + settingsService.getLastBoardId());

                // Note(ebiggz): Angular sometimes adds properties to objects for the purposes of two way bindings
                // and other magical things. Angular has a .toJson() convienence method that coverts an object to a json string
                // while removing internal angular properties. We then convert this string back to an object with
                // JSON.parse. It's kinda hacky, but it's an easy way to ensure we arn't accidentally saving anything extra.
                let cleanedScene = JSON.parse(angular.toJson(scene));

                boardDb.push("./firebot/scenes/" + scene.sceneName, cleanedScene);

                service.getSelectedBoard().scenes[scene.sceneName] = scene;

                // Refresh the interactive control cache.
                ipcRenderer.send('refreshInteractiveCache');

            };

            service.saveCooldownGroupForCurrentBoard = function(previousName, cooldownGroup) {

                if (previousName != null && previousName !== '') {
                    service.deleteCooldownGroupForCurrentBoard(previousName, cooldownGroup);
                }


                let boardDb = dataAccess.getJsonDbInUserData("/user-settings/controls/" + settingsService.getLastBoardId());

                // Note(ebiggz): Angular sometimes adds properties to objects for the purposes of two way bindings
                // and other magical things. Angular has a .toJson() convienence method that coverts an object to a json string
                // while removing internal angular properties. We then convert this string back to an object with
                // JSON.parse. It's kinda hacky, but it's an easy way to ensure we arn't accidentally saving anything extra.
                let cleanedCooldownGroup = JSON.parse(angular.toJson(cooldownGroup));

                if (cleanedCooldownGroup.buttons != null) {
                    cleanedCooldownGroup.buttons.forEach((buttonName) => {
                        boardDb.push(`./firebot/controls/${buttonName}/cooldownGroup`, cooldownGroup.groupName);
                    });
                }

                boardDb.push("./firebot/cooldownGroups/" + cooldownGroup.groupName, cleanedCooldownGroup);

                if (service.getSelectedBoard().cooldownGroups == null) {
                    service.getSelectedBoard().cooldownGroups = {};
                }

                service.getSelectedBoard().cooldownGroups[cooldownGroup.groupName] = cleanedCooldownGroup;

                // Refresh the interactive control cache.
                ipcRenderer.send('refreshInteractiveCache');

                //TODO: propigate cooldown group to related buttons
            };

            service.deleteCooldownGroupForCurrentBoard = function(cooldownGroupName, cooldownGroup) {
                let boardDb = dataAccess.getJsonDbInUserData("/user-settings/controls/" + settingsService.getLastBoardId());

                if (cooldownGroup.buttons != null) {
                    cooldownGroup.buttons.forEach((buttonName) => {
                        boardDb.delete(`./firebot/controls/${buttonName}/cooldownGroup`);
                    });
                }

                boardDb.delete("./firebot/cooldownGroups/" + cooldownGroupName);

                delete service.getSelectedBoard().cooldownGroups[cooldownGroupName];

                // Refresh the interactive control cache.
                ipcRenderer.send('refreshInteractiveCache');
            };

            service.deleteViewerGroupFromAllBoards = function(viewerGroup) {
                let boards = service.getAllBoards();
                // interate through each saved board
                boards.forEach((board) => {
                    let scenes = Object.keys(board.scenes).map(k => board.scenes[k]);
                    // interate through each scene in a board
                    scenes.forEach((scene) => {
                        let groups = scene.default;
                        let index = groups.indexOf(viewerGroup);
                        // check if this group is saved as a scene default
                        if (index !== -1) {
                            // remove from array
                            groups.splice(index, 1);
                            //save to file
                            let boardDb = dataAccess.getJsonDbInUserData(`/user-settings/controls/${board.name}`);
                            boardDb.push(`./firebot/scenes/${scene.sceneName}/default`, groups);
                        }
                    });
                });

                // Refresh the backend cache
                ipcRenderer.send('refreshInteractiveCache');
                ipcRenderer.send('refreshCommandCache');
            };

            service.getScenesForSelectedBoard = function () {
                let board = service.getLastUsedBoard();
                let scenes = [];
                if (board != null) {
                    scenes = Object.keys(board.scenes);
                }
                return scenes;
            };

            service.getControlIdsForSelectedBoard = function () {
                let board = service.getLastUsedBoard();
                let controls = [];
                if (board != null) {
                    controls = Object.keys(board.controls);
                }
                return controls;
            };

            service.getControlsForSelectedBoard = function () {
                let board = service.getLastUsedBoard();
                let controls = [];
                if (board != null) {
                    controls = board.controls;
                }

                return Object.keys(controls).map(key => controls[key]);
            };

            return service;
        });
}());
