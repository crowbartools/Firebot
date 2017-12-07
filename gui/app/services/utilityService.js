'use strict';
(function() {

    // This contains utility functions
    // Just inject "utilityService" into any controller that you want access to these
    const electron = require('electron');
    const logger = require('../../lib/errorLogging.js');

    const _ = require('underscore')._;

    angular
        .module('firebotApp')
        .factory('utilityService', function($rootScope, $uibModal, listenerService) {
            let service = {};

            let copiedEffectsCache = {};
            service.copyEffects = function(type, effects) {
                copiedEffectsCache[type] = JSON.parse(angular.toJson(effects));
            };

            service.getCopiedEffects = function(type) {
                return JSON.parse(JSON.stringify(copiedEffectsCache[type]));
            };

            service.hasCopiedEffects = function(type) {
                return copiedEffectsCache[type] != null;
            };

            let slidingModals = [];
            const shiftAmount = 75;
            service.addSlidingModal = function(promise) {
                // update previous values
                slidingModals.forEach(em => {
                    let newAmount = em.transform + shiftAmount;
                    em.transform = newAmount;
                    em.element.css("transform", `translate(-${newAmount}px, 0)`);
                });

                promise.then((data) => {
                    data.transform = 0;
                    slidingModals.push(data);
                });
            };

            service.removeSlidingModal = function() {
                slidingModals.pop();

                // update previous values
                slidingModals.forEach(em => {
                    let newAmount = em.transform - shiftAmount;
                    em.transform = newAmount;
                    em.element.css("transform", `translate(-${newAmount}px, 0)`);
                });
            };

            service.closeToModalId = function(modalId) {
                let minId = modalId.replace("modal", "");

                let closeList = [];
                slidingModals.forEach(m => {
                    let nextId = m.id.replace("modal", "");
                    if (minId < nextId && minId !== nextId) {
                        closeList.push(m);
                    }
                });

                closeList.forEach(m => {
                    m.instance.dismiss();
                });
            };

            service.saveAllSlidingModals = function() {
                let lastEditModalId = slidingModals[0].id;

                let saveList = [];
                slidingModals.forEach(m => {
                    if (m.id !== lastEditModalId) {
                        saveList.push(m);
                    }
                });

                saveList.reverse().forEach(m => {
                    m.onSaveAll();
                });
            };

            service.getSlidingModalNamesAndIds = function() {
                return slidingModals.map(sm => {
                    return {name: sm.name, id: sm.id};
                });
            };

            service.updateNameForSlidingModal = function(newName, modalId) {
                slidingModals.filter(m => m.id === modalId).forEach(m => m.name = newName);
            };

            service.showModal = function(showModalContext) {

                // We dont want to do anything if there's no context
                if (showModalContext == null) {
                    console.log("showModal() was called but no context was provided!");
                    return;
                }

                // Pull values out of the context
                let templateUrl = showModalContext.templateUrl;
                let controllerFunc = showModalContext.controllerFunc;
                let resolveObj = showModalContext.resolveObj || {};
                let closeCallback = showModalContext.closeCallback;
                let dismissCallback = showModalContext.dismissCallback;

                let modalId = "modal" + _.uniqueId().toString();
                resolveObj.modalId = () => {
                    return modalId;
                };

                // Show the modal
                let modalInstance = $uibModal.open({
                    ariaLabelledBy: 'modal-title',
                    ariaDescribedBy: 'modal-body',
                    templateUrl: templateUrl,
                    controller: controllerFunc,
                    resolve: resolveObj,
                    size: showModalContext.size,
                    keyboard: showModalContext.keyboard,
                    backdrop: showModalContext.backdrop ? showModalContext.backdrop : true,
                    windowClass: modalId
                });

                // If no callbacks were defined, create blank ones. This avoids a console error
                if (typeof closeCallback !== "function") {
                    closeCallback = () => {};
                }
                if (typeof dismissCallback !== "function") {
                    dismissCallback = () => {};
                }

                // Handle when the modal is exited
                modalInstance.result.then(closeCallback, dismissCallback);
            };

            /*
             * FIRST TIME USE MODAL
             */
            service.showSetupWizard = function() {
                let firstTimeUseModalContext = {
                    templateUrl: "./templates/misc-modals/firstTimeUseModal.html",
                    // This is the controller to be used for the modal.
                    controllerFunc: "firstTimeUseModalController",
                    keyboard: false,
                    backdrop: 'static',
                    closeCallback: () => {}
                };
                service.showModal(firstTimeUseModalContext);
            };

            /*
             * OVERLAY INFO MODAL
             */
            service.showOverlayInfoModal = function(instanceName) {
                let overlayInfoModalContext = {
                    templateUrl: "overlayInfoModal.html",
                    // This is the controller to be used for the modal.
                    controllerFunc: ($scope, $rootScope, $uibModalInstance, settingsService, instanceName) => {

                        $scope.overlayPath = `http://localhost:${settingsService.getWebServerPort()}/overlay`;

                        if (instanceName != null && instanceName !== "") {
                            $scope.showingInstance = true;
                            $scope.overlayPath = $scope.overlayPath + "?instance=" + encodeURIComponent(instanceName);
                        }

                        $scope.usingOverlayInstances = settingsService.useOverlayInstances();

                        $scope.pathCopied = false;

                        $scope.copy = function() {
                            $rootScope.copyTextToClipboard($scope.overlayPath);
                            $scope.pathCopied = true;
                        };

                        $scope.dismiss = function() {
                            $uibModalInstance.dismiss('cancel');
                        };
                    },
                    resolveObj: {
                        instanceName: () => {
                            return instanceName;
                        }
                    }
                };
                service.showModal(overlayInfoModalContext);
            };

            /*
             * OVERLAY INFO MODAL
             */
            service.showOverlayshowEventsModal = function() {
                let overlayshowEventsModalContext = {
                    templateUrl: "overlayshowEventsModal.html",
                    // This is the controller to be used for the modal.
                    controllerFunc: ($scope, $rootScope, $uibModalInstance, settingsService) => {

                        // TODO: Load $scope.textSettings via settingsService
                        $scope.textSettings = {};

                        $scope.save = function() {
                            // TODO: $scope.textSettings to file via settingsService
                        };

                        $scope.dismiss = function() {
                            $uibModalInstance.dismiss('cancel');
                        };
                    }
                };
                service.showModal(overlayshowEventsModalContext);
            };

            /*
             * JUST UPDATED MODAL
             */
            service.showUpdatedModal = function() {
                let justUpdatedModalContext = {
                    templateUrl: "updatedModal.html",
                    // This is the controller to be used for the modal.
                    controllerFunc: ($scope, $uibModalInstance) => {

                        let appVersion = electron.remote.app.getVersion();

                        $scope.appVersion = `v${appVersion}`;

                        $scope.dismiss = function() {
                            $uibModalInstance.dismiss('cancel');
                        };
                    },
                    size: "sm"
                };
                service.showModal(justUpdatedModalContext);
            };

            /*
             * ERROR MODAL
             */
            let previousErrorMessage = "";
            let errorModalOpen = false;
            service.showErrorModal = function(errorMessage) {
                if (errorModalOpen && previousErrorMessage === errorMessage) {
                    return;
                }
                previousErrorMessage = errorMessage;

                $rootScope.showSpinner = false;
                let errorModalContext = {
                    templateUrl: "errorModal.html",
                    // This is the controller to be used for the modal.
                    controllerFunc: ($scope, $uibModalInstance, message) => {

                        $scope.message = message;

                        $scope.close = function() {
                            $uibModalInstance.close();
                        };

                        $scope.dismiss = function() {
                            $uibModalInstance.dismiss('cancel');
                        };
                    },
                    resolveObj: {
                        message: () => {
                            return errorMessage;
                        }
                    },
                    closeCallback: () => {
                        errorModalOpen = false;
                    }
                };

                errorModalOpen = true;
                service.showModal(errorModalContext);

                // Log error to file.
                logger.log(errorMessage);
            };

            /*
             * DOWNLOAD MODAL
             */
            service.showDownloadModal = function() {
                let downloadModalContext = {
                    templateUrl: "downloadModal.html",
                    keyboard: false,
                    backdrop: 'static',
                    size: 'sm',
                    // This is the controller to be used for the modal.
                    controllerFunc: ($scope, $uibModalInstance, $timeout, listenerService) => {

                        $scope.downloadHasError = false;
                        $scope.errorMessage = "";

                        $scope.downloadComplete = false;

                        // Update error listener
                        let registerRequest = {
                            type: listenerService.ListenerType.UPDATE_ERROR,
                            runOnce: true
                        };
                        listenerService.registerListener(registerRequest, (errorMessage) => {
                            // the autoupdater had an error
                            $scope.downloadHasError = true;
                            $scope.errorMessage = errorMessage;
                        });

                        // Update downloaded listener
                        let updateDownloadedListenerRequest = {
                            type: listenerService.ListenerType.UPDATE_DOWNLOADED,
                            runOnce: true
                        };
                        listenerService.registerListener(updateDownloadedListenerRequest, () => {
                            // the autoupdater has downloaded the update and restart shortly
                            $scope.downloadComplete = true;
                        });

                        // Start timer for if the download seems to take longer than normal,
                        // we want to allow user to close modal.
                        // Currently set to a minute and a half
                        $timeout(() => {
                            if (!$scope.downloadComplete) {
                                $scope.downloadHasError = true;
                                $scope.errorMessage = "Download is taking longer than normal. There may have been an error. You can keep waiting or close this and try again later.";
                            }
                        }, 90 * 1000);

                        $scope.dismiss = function() {
                            $uibModalInstance.dismiss('cancel');
                        };
                    }
                };
                service.showModal(downloadModalContext);
            };

            // This is used by effects that make use of lists of checkboxes. Returns and array of selected boxes.
            service.getNewArrayWithToggledElement = function(array, element) {
                let itemArray = [],
                    itemIndex = -1;
                if (array != null) {
                    itemArray = array;
                }
                try {
                    itemIndex = itemArray.indexOf(element);
                } catch (err) {} //eslint-disable-line no-empty

                if (itemIndex !== -1) {
                    // Item exists, so we're unchecking it.
                    itemArray.splice(itemIndex, 1);
                } else {
                    // Item doesn't exist! Add it in.
                    itemArray.push(element);
                }

                // Set new scope var.
                return itemArray;
            };

            // This is used to check for an item in a saved array and returns true if it exists.
            service.arrayContainsElement = function(array, element) {
                if (array != null) {
                    return array.indexOf(element) !== -1;
                }
                return false;

            };

            /*
             * INFO MODAL
             */
            let previousInfoMessage = "";
            let infoModalOpen = false;
            service.showInfoModal = function(infoMessage) {
                if (infoModalOpen && previousInfoMessage === infoMessage) {
                    return;
                }
                previousInfoMessage = infoMessage;

                $rootScope.showSpinner = false;
                let infoModalContext = {
                    templateUrl: "infoModal.html",
                    // This is the controller to be used for the modal.
                    controllerFunc: ($scope, $uibModalInstance, message) => {

                        $scope.message = message;

                        $scope.close = function() {
                            $uibModalInstance.close();
                        };
                    },
                    resolveObj: {
                        message: () => {
                            return infoMessage;
                        }
                    },
                    closeCallback: () => {
                        infoModalOpen = false;
                    }
                };

                infoModalOpen = true;
                service.showModal(infoModalContext);

                // Log info to file.
                logger.log(infoMessage);
            };

            /*
            * EDIT EFFECT MODAL
            */
            service.showEditEffectModal = function (effect, index, triggerType, closeCallback) {
                let showEditEffectContext = {
                    templateUrl: "editEffectModal.html",
                    controllerFunc: ($scope, $uibModalInstance, utilityService, modalId, effect, index, triggerType) => {

                        $scope.effect = JSON.parse(angular.toJson(effect));
                        $scope.triggerType = triggerType;
                        $scope.modalId = modalId;

                        $scope.effectTypeChanged = function(effectType) {
                            $scope.effect.type = effectType.name;
                            utilityService.updateNameForSlidingModal(effectType.name, modalId);
                        };

                        $scope.openModals = utilityService.getSlidingModalNamesAndIds();
                        $scope.closeToModal = utilityService.closeToModalId;

                        utilityService.addSlidingModal($uibModalInstance.rendered.then(() => {
                            let modalElement = $("." + modalId).children();
                            return {
                                element: modalElement,
                                name: effect.type,
                                id: modalId,
                                instance: $uibModalInstance,
                                onSaveAll: () => {
                                    $scope.save();
                                }
                            };
                        }));

                        $scope.$on('modal.closing', function() {
                            utilityService.removeSlidingModal();
                        });

                        $scope.saveAll = function() {
                            //$scope.save();
                            utilityService.saveAllSlidingModals();
                        };

                        $scope.save = function() {
                            console.log("saving" + $scope.effect.type);
                            $uibModalInstance.close({
                                action: "update",
                                effect: $scope.effect,
                                index: index
                            });
                        };

                        $scope.copy = function() {
                            utilityService.copyEffects(triggerType, [$scope.effect]);
                        };

                        $scope.paste = function() {
                            if ($scope.hasCopiedEffect()) {
                                $scope.effect = utilityService.getCopiedEffects(triggerType)[0];
                            }
                        };

                        $scope.hasCopiedEffect = function() {
                            return utilityService.hasCopiedEffects(triggerType) &&
                            utilityService.getCopiedEffects(triggerType).length < 2;
                        };

                        $scope.delete = function() {
                            $uibModalInstance.close({
                                action: "delete",
                                effect: $scope.effect,
                                index: index
                            });
                        };

                        $scope.dismiss = function() {
                            $uibModalInstance.dismiss();
                        };
                    },
                    resolveObj: {
                        effect: () => {
                            return effect;
                        },
                        triggerType: () => {
                            return triggerType;
                        },
                        index: () => {
                            return index;
                        }
                    },
                    closeCallback: closeCallback
                };

                service.showModal(showEditEffectContext);
            };

            // Watches for an event from main process
            listenerService.registerListener({
                type: listenerService.ListenerType.INFO
            },
            (infoMessage) => {
                service.showInfoModal(infoMessage);
            });

            // Watches for an event from main process
            listenerService.registerListener({
                type: listenerService.ListenerType.ERROR
            },
            (errorMessage) => {
                service.showErrorModal(errorMessage);
            });


            return service;
        });
}());