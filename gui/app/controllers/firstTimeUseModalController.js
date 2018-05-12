'use strict';
(function() {

    //TODO: Rename this to setupWizardModalController

    const dataAccess = require('../../lib/common/data-access.js');
    const fs = require('fs');
    const ncp = require('ncp');
    const unzipper = require('unzipper');

    angular
        .module('firebotApp')
        .controller('firstTimeUseModalController', function (logger, $rootScope, $scope, $uibModalInstance,
            $q, connectionService, boardService, settingsService, listenerService, groupsService) {

            function copyUserSettingsToUserDataFolder(filePath, callback) {
                let source = filePath;
                let destination = dataAccess.getPathInUserData("/user-settings");
                ncp(source, destination, function (err) {
                    if (err) {
                        logger.error("Failed to copy 'user-settings'!");
                        logger.error(err);
                        callback();
                        return;
                    }
                    logger.info('Copied "user-settings" to user data.');
                    callback();
                });
            }

            function loadBoardsAndLogins() {
                boardService.loadAllBoards().then(() => {

                    connectionService.loadLogin();
                    groupsService.loadViewerGroups();

                    $scope.$applyAsync();

                    $rootScope.showSpinner = false;
                    $scope.setCurrentStep(6);
                });
            }

            function validateUserSettingsFolder(filePath) {
                // Not the best validation, but it should prevent most mistakes.
                if (!fs.existsSync(filePath) || !filePath.endsWith("user-settings")) {
                    $scope.importErrorOccured = true;
                    $scope.importErrorMessage = "This is not a valid 'user-settings' folder.";
                } else {
                    $rootScope.showSpinner = true;
                    copyUserSettingsToUserDataFolder(filePath, () => {
                        loadBoardsAndLogins();
                    });
                }
            }

            $scope.steps = ['one', 'two', 'three', 'four', 'five', 'six', 'seven'];
            $scope.stepTitles = ['', 'Import Data', 'Restore Backup', 'Get Signed In', 'Sync Controls From Mixer', 'Your First Board', ''];
            $scope.step = 0;

            $scope.isFirstStep = function () {
                return $scope.step === 0;
            };

            $scope.isLastStep = function () {
                return $scope.step === ($scope.steps.length - 1);
            };

            $scope.isCurrentStep = function (step) {
                return $scope.step === step;
            };

            $scope.setCurrentStep = function (step) {
                $scope.step = step;
            };

            $scope.getCurrentStep = function () {
                return $scope.steps[$scope.step];
            };

            $scope.getStepTitle = function () {
                return $scope.stepTitles[$scope.step];
            };

            $scope.getNextLabel = function () {
                switch ($scope.step) {
                default:
                    return "Next";
                }
            };

            $scope.handlePrevious = function () {
                switch ($scope.step) {
                case 3:
                case 2:
                    $scope.step = 0;
                    break;
                default:
                    $scope.step -= ($scope.isFirstStep()) ? 0 : 1;
                }
            };

            $scope.showNextButton = function() {
                if ($scope.isFirstStep() || $scope.isLastStep()) {
                    return false;
                }

                if ($scope.step === 1) {
                    return false;
                }
                return true;
            };

            $scope.showBackButton = function() {
                return !($scope.isFirstStep() || $scope.isLastStep());
            };

            $scope.canGoToNext = function() {
                switch ($scope.step) {
                case 3:
                    return connectionService.accounts.streamer.isLoggedIn;
                case 5:
                    return $scope.hasBoardsLoaded;
                }
                return true;
            };

            $scope.handleNext = function (forceNext) {
                if ($scope.isLastStep()) {
                    $uibModalInstance.close();
                } else {
                    switch ($scope.step) {
                    case 0:
                        break;
                    case 3:
                    case 5:
                        if (!$scope.canGoToNext() && !forceNext) return;
                        break;
                    }
                    $scope.step += 1;
                }
            };

            $scope.getTooltipText = function() {
                switch ($scope.step) {
                case 3:
                    return "Please sign into your Streamer account.";
                case 5:
                    return "A board needs to be added.";
                }
                return "";
            };




            /*
            * Data import
            */
            $scope.openImportBrowser = function() {
                let registerRequest = {
                    type: listenerService.ListenerType.IMPORT_FOLDER,
                    runOnce: true,
                    publishEvent: true
                };
                listenerService.registerListener(registerRequest, (filepath) => {
                    validateUserSettingsFolder(filepath);
                });
            };

            function validateBackupZip(filepath) {
                let foundUserSettings = false;
                return fs.createReadStream(filepath)
                    .pipe(unzipper.Parse() //eslint-disable-line new-cap
                        .on('entry', entry => {
                            if (entry.path.includes("user-settings")) {
                                foundUserSettings = true;
                            }
                            entry.autodrain();
                        }))
                    .promise()
                    .then(() => {
                        logger.info(foundUserSettings);
                        return { valid: foundUserSettings, path: filepath };
                    }, e => logger.error('error while reading backup zip', e));
            }

            function extractBackupToTemp(filepath) {
                fs.createReadStream(filepath)
                    .pipe(
                        unzipper.Extract({ path: dataAccess.getPathInTmpDir("/restore") }) //eslint-disable-line new-cap
                            .on('close', () => {
                                logger.info("extracted backup!");
                                let source = dataAccess.getPathInTmpDir("/restore/user-settings");
                                copyUserSettingsToUserDataFolder(source, () => {
                                    loadBoardsAndLogins();
                                });
                            }));
            }

            $scope.openBackupBrowser = function() {
                let registerRequest = {
                    type: listenerService.ListenerType.IMPORT_BACKUP_ZIP,
                    runOnce: true,
                    publishEvent: true
                };
                listenerService.registerListener(registerRequest, (filepath) => {
                    validateBackupZip(filepath).then(resp => {
                        if (resp.valid) {
                            logger.debug("Backup is valid, attempting to extract...");
                            let filepath = resp.path;
                            extractBackupToTemp(filepath);
                        } else {
                            $scope.importErrorOccured = true;
                            $scope.importErrorMessage = "Provided backup zip does not appear to be valid!";
                        }
                    }, e => {
                        logger.warn("backup restore failed: " + e);
                    });
                });
            };

            $scope.importErrorOccured = false;
            $scope.importErrorMessage = "";

            $scope.streamerAccount = connectionService.accounts.streamer;

            $scope.botAccount = connectionService.accounts.bot;

            $scope.loginOrLogout = connectionService.loginOrLogout;

            $scope.hasBoardsLoaded = boardService.hasBoardsLoaded();

            $scope.firstBoard = {
                id: ""
            };

            $scope.boardAddErrorOccured = false;

            $scope.selectedBoardName = function() {
                let board = boardService.getSelectedBoard();
                if (board != null) {
                    return board.name;
                }
                return "";
            };

            $scope.addBoard = function() {
                let boardId = $scope.firstBoard.id;
                if (boardId == null || boardId.length === 0) {
                    return;
                }
                boardService.loadBoardWithId(boardId).then((boards) => {
                    let board = boards[0];
                    boardService.setSelectedBoard(board);
                    /**
                    * Note(ebiggz): This is a workaround to ensure boards load and update scope.
                    * I need to update boardService to use the $q service for Promises instead of regular Promises.
                    */
                    $q.resolve(true, () => {
                        $scope.hasBoardsLoaded = true;
                    });
                }, () => {
                    $q.resolve(true, () => {
                        $scope.boardAddErrorOccured = true;
                    });

                });
            };

            $scope.dismiss = function(reason) {
                $uibModalInstance.dismiss(reason);
            };
        });
}());
