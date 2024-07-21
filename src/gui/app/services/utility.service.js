"use strict";
(function() {
    // This contains utility functions
    // Just inject "utilityService" into any controller that you want access to these
    const _ = require("underscore")._;

    const dataAccess = require("../../backend/common/data-access.js");

    angular
        .module("firebotApp")
        .factory("utilityService", function(
            $rootScope,
            $uibModal,
            listenerService,
            logger,
            $timeout,
            backendCommunicator
        ) {
            const service = {};


            backendCommunicator.on("requestIntegrationAccountId", (data) => {
                service.openGetIdEntyModal({
                    label: `Enter ${data.integrationName} ${data.label ? data.label : "ID"}`,
                    saveText: "Save",
                    inputPlaceholder: `Enter ${data.label ? data.label : "ID"}`,
                    idLabel: data.label,
                    steps: data.steps
                }, (model) => {
                    backendCommunicator.fireEvent("enteredIntegrationAccountId", {
                        integrationId: data.integrationId,
                        accountId: model
                    });
                });
            });

            backendCommunicator.on("showViewerCard", (userId) => {
                service.showModal({
                    component: "viewerDetailsModal",
                    backdrop: true,
                    resolveObj: {
                        userId: () => userId
                    },
                    closeCallback: () => {},
                    dismissCallback: () => {}
                });
            });

            service.openGetIdEntyModal = function(options, callback) {
                service.showModal({
                    component: "idEntryModal",
                    size: "sm",
                    resolveObj: {
                        model: () => options.model,
                        label: () => options.label,
                        inputPlaceholder: () => options.inputPlaceholder,
                        saveText: () => options.saveText,
                        steps: () => options.steps,
                        idLabel: () => options.idLabel
                    },
                    closeCallback: (resp) => {
                        callback(resp.model);
                    }
                });
            };

            const slidingModals = [];
            const shiftAmount = 125;
            service.addSlidingModal = function(promise) {
                // update previous values
                slidingModals.forEach((em) => {
                    const newAmount = em.transform + shiftAmount;
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
                slidingModals.forEach((em) => {
                    const newAmount = em.transform - shiftAmount;
                    em.transform = newAmount;
                    em.element.css("transform", `translate(-${newAmount}px, 0)`);
                });
            };

            service.closeToModalId = function(modalId) {
                const minId = modalId.replace("modal", "");

                const closeList = [];
                slidingModals.forEach((m) => {
                    const nextId = m.id.replace("modal", "");
                    if (minId < nextId && minId !== nextId) {
                        closeList.push(m);
                    }
                });

                closeList.forEach((m) => {
                    m.instance.dismiss();
                });
            };

            service.saveAllSlidingModals = function() {
                const lastEditModalId = slidingModals[0].id;

                const saveList = [];
                slidingModals.forEach((m) => {
                    if (m.id !== lastEditModalId) {
                        saveList.push(m);
                    }
                });

                saveList.reverse().forEach((m) => {
                    m.onSaveAll();
                });
            };

            service.getSlidingModalNamesAndIds = function() {
                return slidingModals.map((sm) => {
                    return { name: sm.name, id: sm.id };
                });
            };

            service.updateNameForSlidingModal = function(newName, modalId) {
                slidingModals
                    .filter(m => m.id === modalId)
                    .forEach(m => (m.name = newName));
            };

            service.showModal = function(showModalContext) {
                // We don't want to do anything if there's no context
                if (showModalContext == null) {
                    logger.warn("showModal() was called but no context was provided!");
                    return;
                }

                // Pull values out of the context
                const component = showModalContext.component;
                const templateUrl = showModalContext.templateUrl;
                const controllerFunc = showModalContext.controllerFunc;
                const resolveObj = showModalContext.resolveObj || {};
                let closeCallback = showModalContext.closeCallback;
                let dismissCallback = showModalContext.dismissCallback;
                const windowClass = showModalContext.windowClass ? showModalContext.windowClass : "";

                const modalId = `modal${_.uniqueId().toString()}`;
                resolveObj.modalId = () => {
                    return modalId;
                };

                const modal = {
                    ariaLabelledBy: "modal-title",
                    ariaDescribedBy: "modal-body",
                    resolve: resolveObj,
                    size: showModalContext.size,
                    keyboard: showModalContext.keyboard ? showModalContext.keyboard : true,
                    backdrop: showModalContext.backdrop ? showModalContext.backdrop : 'static',
                    windowClass: `${windowClass} ${modalId} animated fadeIn fastest fb-transition draggablemodal`,
                    animation: true
                };

                if (component != null && component.length !== 0) {
                    modal.component = component;
                } else {
                    modal.templateUrl = templateUrl;
                    modal.controller = controllerFunc;
                }

                // Show the modal
                const modalInstance = $uibModal.open(modal);

                // If no callbacks were defined, create blank ones. This avoids a console error
                if (typeof closeCallback !== "function") {
                    closeCallback = () => {};
                }
                if (typeof dismissCallback !== "function") {
                    dismissCallback = () => {};
                }

                const renderedPromise = modalInstance.rendered.then(() => {
                    const modalNode = $(`.${modalId}`);
                    modalNode.removeClass("animated fadeIn fastest");

                    if (showModalContext.autoSlide !== false) {
                        angular.element(`.${modalId}`)
                            .scope()
                            .$on("modal.closing", function() {
                                service.removeSlidingModal();
                            });
                    }

                    return {
                        element: modalNode.children(),
                        name: showModalContext.breadcrumbName ?? "",
                        id: modalId,
                        instance: modalInstance
                    };
                });

                if (showModalContext.autoSlide !== false) {
                    service.addSlidingModal(renderedPromise);
                }

                // Handle when the modal is exited
                modalInstance.result.then(closeCallback, dismissCallback);
            };

            /*
             * FIRST TIME USE MODAL
             */
            service.showSetupWizard = function(allowExit = false) {
                service.showModal({
                    component: "setupWizardModal",
                    keyboard: allowExit ? true : false,
                    backdrop: allowExit ? true : "static",
                    closeCallback: () => {}
                });
            };

            service.openGetInputModal = function(options, callback) {
                service.showModal({
                    component: "inputModal",
                    size: "sm",
                    resolveObj: {
                        model: () => options.model,
                        inputType: () => options.inputType,
                        label: () => options.label,
                        inputPlaceholder: () => options.inputPlaceholder,
                        saveText: () => options.saveText,
                        useTextArea: () => options.useTextArea,
                        descriptionText: () => options.descriptionText,
                        validationFn: () => options.validationFn,
                        validationText: () => options.validationText,
                        trigger: () => options.trigger,
                        triggerMeta: () => options.triggerMeta
                    },
                    closeCallback: (resp) => {
                        callback(resp.model);
                    }
                });
            };

            service.openDateModal = function(options, callback) {
                service.showModal({
                    component: "dateModal",
                    size: "sm",
                    resolveObj: {
                        model: () => options.model,
                        label: () => options.label,
                        inputPlaceholder: () => options.inputPlaceholder,
                        saveText: () => options.saveText
                    },
                    closeCallback: (resp) => {
                        callback(resp.model);
                    }
                });
            };

            service.openSelectModal = function(options, callback) {
                service.showModal({
                    component: "selectModal",
                    size: "sm",
                    resolveObj: {
                        model: () => options.model,
                        options: () => options.options,
                        label: () => options.label,
                        selectPlaceholder: () => options.selectPlaceholder,
                        saveText: () => options.saveText,
                        validationText: () => options.validationText
                    },
                    closeCallback: async (resp) => {
                        callback(resp.model);
                    }
                });
            };

            service.openViewerSearchModal = function(options, callback) {
                service.showModal({
                    component: "viewerSearchModal",
                    breadcrumbName: "Viewer Search",
                    size: "sm",
                    backdrop: true,
                    resolveObj: {
                        model: () => options.model,
                        label: () => options.label,
                        saveText: () => options.saveText,
                        validationFn: () => options.validationFn,
                        validationText: () => options.validationText
                    },
                    closeCallback: (resp) => {
                        callback(resp.model);
                    }
                });
            };

            /*
             * OVERLAY INFO MODAL
             */
            service.showOverlayInfoModal = function(instanceName) {
                const overlayInfoModalContext = {
                    templateUrl: "overlayInfoModal.html",
                    // This is the controller to be used for the modal.
                    controllerFunc: (
                        $scope,
                        $rootScope,
                        $uibModalInstance,
                        ngToast,
                        settingsService,
                        instanceName
                    ) => {

                        $scope.usingOverlayInstances = settingsService.useOverlayInstances();

                        $scope.broadcastingSoftwares = [
                            "Local", "Direct Link/2 PC Setup"
                        ];

                        $scope.selectedBroadcastingSoftware = "Local";

                        $scope.updateSelectedBroadcastingSoftware = (type) => {
                            $scope.selectedBroadcastingSoftware = type;
                            $scope.buildOverlayPath();
                        };

                        $scope.overlayPath = "";
                        $scope.buildOverlayPath = () => {
                            let overlayPath = dataAccess.getPathInUserData("overlay.html");

                            const port = settingsService.getWebServerPort();

                            const params = {};
                            if ($scope.selectedBroadcastingSoftware === "Direct Link/2 PC Setup") {
                                overlayPath = `http://localhost:${port}/overlay`;

                            } else {
                                if (port !== 7472 && !isNaN(port)) {
                                    params["port"] = settingsService.getWebServerPort();
                                }
                                overlayPath = `file:///${overlayPath.replace(/^\//g, "")}`;
                            }


                            if (instanceName != null && instanceName !== "") {
                                $scope.showingInstance = true;
                                params["instance"] = encodeURIComponent(instanceName);
                            }

                            let paramCount = 0;
                            Object.entries(params).forEach((p) => {
                                const key = p[0],
                                    value = p[1];

                                const prefix = paramCount === 0 ? "?" : "&";

                                overlayPath += `${prefix}${key}=${value}`;

                                paramCount++;
                            });

                            $scope.overlayPath = overlayPath;
                        };
                        $scope.buildOverlayPath();

                        $scope.pathCopied = false;
                        $scope.copy = function() {
                            $rootScope.copyTextToClipboard($scope.overlayPath);
                            ngToast.create({
                                className: 'success',
                                content: "Overlay path copied!"
                            });
                        };

                        $scope.dismiss = function() {
                            $uibModalInstance.dismiss("cancel");
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
            service.showOverlayEventsModal = function() {
                const overlayEventsModalContext = {
                    templateUrl: "overlayEventsModal.html",
                    // This is the controller to be used for the modal.
                    controllerFunc: (
                        $scope,
                        $rootScope,
                        $uibModalInstance,
                        settingsService
                    ) => {
                        $scope.textSettings = settingsService.getOverlayEventsSettings();

                        $scope.save = function() {
                            settingsService.saveOverlayEventsSettings($scope.textSettings);
                            $uibModalInstance.dismiss();
                        };

                        $scope.dismiss = function() {
                            $uibModalInstance.dismiss("cancel");
                        };
                    }
                };
                service.showModal(overlayEventsModalContext);
            };

            /*
             * JUST UPDATED MODAL
             */
            service.showUpdatedModal = function() {
                const justUpdatedModalContext = {
                    templateUrl: "updatedModal.html",
                    // This is the controller to be used for the modal.
                    controllerFunc: ($scope, $uibModalInstance) => {
                        const appVersion = firebotAppDetails.version;

                        $scope.appVersion = `v${appVersion}`;

                        $scope.dismiss = function() {
                            $uibModalInstance.dismiss("cancel");
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
                } else if (errorModalOpen) {
                    return;
                }
                previousErrorMessage = errorMessage;

                $rootScope.showSpinner = false;
                const errorModalContext = {
                    templateUrl: "errorModal.html",
                    // This is the controller to be used for the modal.
                    controllerFunc: ($scope, $uibModalInstance, message) => {
                        $scope.message = message;

                        $scope.close = function() {
                            $uibModalInstance.close();
                        };

                        $scope.dismiss = function() {
                            $uibModalInstance.dismiss("cancel");
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
                logger.warn(errorMessage);
            };

            service.showErrorDetailModal = function(title, details, modalSize = "sm") {
                service.showModal({
                    component: "errorDetailModal",
                    size: modalSize,
                    resolveObj: {
                        title: () => title,
                        details: () => details
                    }
                });
            };

            /*
             * DOWNLOAD MODAL
             */
            service.showDownloadModal = function() {
                const downloadModalContext = {
                    templateUrl: "downloadModal.html",
                    keyboard: false,
                    backdrop: "static",
                    size: "sm",
                    // This is the controller to be used for the modal.
                    controllerFunc: (
                        $scope,
                        $uibModalInstance,
                        $timeout,
                        listenerService,
                        updatesService
                    ) => {
                        $scope.downloadHasError = false;
                        $scope.errorMessage = "";

                        $scope.downloadComplete = false;

                        // Update error listener
                        const registerRequest = {
                            type: listenerService.ListenerType.UPDATE_ERROR,
                            runOnce: true
                        };
                        listenerService.registerListener(registerRequest, (errorMessage) => {
                            // the autoupdater had an error
                            $scope.downloadHasError = true;
                            $scope.errorMessage = errorMessage;
                        });

                        // Update downloaded listener
                        const updateDownloadedListenerRequest = {
                            type: listenerService.ListenerType.UPDATE_DOWNLOADED,
                            runOnce: true
                        };
                        listenerService.registerListener(
                            updateDownloadedListenerRequest,
                            () => {
                                // the autoupdater has downloaded the update
                                $scope.downloadComplete = true;
                                updatesService.updateIsDownloaded = true;
                            }
                        );

                        // Install update listener
                        const installUpdateListenerRequest = {
                            type: listenerService.ListenerType.INSTALLING_UPDATE,
                            runOnce: true
                        };
                        listenerService.registerListener(
                            installUpdateListenerRequest,
                            () => {
                                // the autoupdater is installing the update
                                $scope.downloadComplete = true;
                                $scope.installing = true;
                            }
                        );

                        // Start timer for if the download seems to take longer than normal,
                        // we want to allow user to close modal.
                        // Currently set to a minute and a half
                        $timeout(() => {
                            if (!$scope.downloadComplete) {
                                $scope.downloadHasError = true;
                                $scope.errorMessage =
                  "Download is taking longer than normal. There may have been an error. You can keep waiting or close this and try again later.";
                            }
                        }, 180 * 1000);

                        $scope.installUpdate = function() {
                            updatesService.installUpdate();
                        };

                        $scope.dismiss = function() {
                            $uibModalInstance.dismiss("cancel");
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
                const infoModalContext = {
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
                logger.info(infoMessage);
            };

            /*
            * EDIT EFFECT MODAL
            */
            service.showEditEffectModal = function(
                effect,
                index,
                triggerType,
                closeCallback,
                triggerMeta,
                isNew
            ) {
                const showEditEffectContext = {
                    templateUrl: "editEffectModal.html",
                    keyboard: false,
                    backdrop: "static",
                    windowClass: "effect-edit-modal",
                    autoSlide: false,
                    controllerFunc: function (
                        $scope,
                        $rootScope,
                        $uibModalInstance,
                        ngToast,
                        utilityService,
                        effectHelperService,
                        backendCommunicator,
                        logger,
                        modalId,
                        effect,
                        index,
                        triggerType,
                        triggerMeta,
                        objectCopyHelper
                    ) {
                        $scope.effect = JSON.parse(angular.toJson(effect));
                        $scope.triggerType = triggerType;
                        $scope.triggerMeta = triggerMeta;
                        $scope.modalId = modalId;

                        $scope.isAddMode = isNew;
                        $scope.effectDefinition = effectHelperService.getEffectDefinition(
                            $scope.effect.type
                        );

                        $scope.getOverflowMenu = () => {
                            return [
                                {
                                    html: `<a href ><i class="fal fa-tag" style="margin-right: 10px; aria-hidden="true""></i> ${$scope.getLabelButtonTextForLabel($scope.effect.effectLabel)}</a>`,
                                    click: function () {
                                        $scope.editLabel();
                                    }
                                },
                                {
                                    html: `<a href ><span class="iconify" data-icon="mdi:content-copy" style="margin-right: 10px;" aria-hidden="true"></span> Copy</a>`,
                                    click: function () {
                                        $scope.copy();
                                    }
                                },
                                {
                                    text: "Copy Effect JSON",
                                    children: [
                                        {
                                            text: "For Custom Scripts",
                                            click: () => {
                                                $rootScope.copyTextToClipboard(angular.toJson($scope.effect));

                                                ngToast.create({
                                                    className: 'success',
                                                    content: 'Copied effect json to clipboard.'
                                                });
                                            }
                                        },
                                        {
                                            text: "For $runEffect[]",
                                            click: () => {
                                                $rootScope.copyTextToClipboard(
                                                    `$runEffect[\`\`${angular.toJson($scope.effect)}\`\`]`
                                                );

                                                ngToast.create({
                                                    className: 'success',
                                                    content: 'Copied $runEffect with effect json to clipboard.'
                                                });
                                            }
                                        }
                                    ]
                                },
                                {
                                    html: `<a href ><span class="iconify" data-icon="mdi:content-paste" style="margin-right: 10px;" aria-hidden="true"></span> Paste</a>`,
                                    enabled: $scope.hasCopiedEffect(),
                                    click: function () {
                                        $scope.paste();
                                    }
                                },
                                {
                                    html: `<a href style="color: #fb7373;"><i class="fal fa-trash-alt" style="margin-right: 10px;" aria-hidden="true"></i> Delete</a>`,
                                    click: function () {
                                        $scope.delete();
                                    }
                                }
                            ];
                        };

                        function effectTypeUpdated() {
                            $scope.effectDefinition = effectHelperService.getEffectDefinition(
                                $scope.effect.type
                            );
                            utilityService.updateNameForSlidingModal(
                                $scope.effectDefinition.definition.name,
                                modalId
                            );
                        }

                        $scope.effectTypeChanged = function(effectType) {
                            if ($scope.effect && $scope.effect.type === effectType.id) {
                                return;
                            }

                            const currentId = $scope.effect.id;
                            $scope.effect = {
                                id: currentId,
                                type: effectType.id
                            };

                            effectTypeUpdated();
                        };

                        $scope.openModals = utilityService.getSlidingModalNamesAndIds();
                        $scope.closeToModal = utilityService.closeToModalId;

                        utilityService.addSlidingModal(
                            $uibModalInstance.rendered.then(() => {
                                const modalElement = $(`.${modalId}`).children();
                                return {
                                    element: modalElement,
                                    name:
                                    $scope.effectDefinition.definition != null
                                        ? $scope.effectDefinition.definition.name
                                        : "Nothing",
                                    id: modalId,
                                    instance: $uibModalInstance,
                                    onSaveAll: () => {
                                        $scope.save();
                                    }
                                };
                            })
                        );

                        $scope.$on("modal.closing", function() {
                            utilityService.removeSlidingModal();
                        });

                        $scope.openOutputsModal = function() {
                            utilityService.showModal({
                                component: "viewEffectOutputsModal",
                                backdrop: false,
                                size: "md",
                                resolveObj: {
                                    effectDefinition: () => $scope.effectDefinition.definition,
                                    effect: () => $scope.effect
                                },
                                closeCallback: (resp) => {
                                    if (resp == null) {
                                        return;
                                    }
                                    const { outputNames } = resp;

                                    if (!$scope.effect) {
                                        $scope.effect = {};
                                    }

                                    $scope.effect.outputNames = outputNames;
                                }
                            });
                        };

                        $scope.openNewEffectModal = function() {
                            utilityService.showModal({
                                component: "addNewEffectModal",
                                breadcrumbName: "Select New Effect",
                                backdrop: true,
                                windowClass: "no-padding-modal",
                                resolveObj: {
                                    trigger: () => triggerType,
                                    triggerMeta: () => triggerMeta,
                                    selectedEffectTypeId: () => $scope.effect && $scope.effect.type
                                },
                                closeCallback: (resp) => {
                                    if (resp == null) {
                                        return;
                                    }
                                    const { selectedEffectDef } = resp;

                                    $scope.effectTypeChanged(selectedEffectDef);
                                }
                            });
                        };

                        async function validateEffect() {

                            if ($scope.effect.type === "Nothing") {
                                ngToast.create("Please select an effect type!");
                                return false;
                            }

                            // validate options
                            const errors = $scope.effectDefinition.optionsValidator(
                                $scope.effect,
                                $scope
                            );

                            if (errors != null && errors.length > 0) {
                                for (const error of errors) {
                                    ngToast.create(error);
                                }
                                return false;
                            }

                            const { triggerType, triggerMeta } = $scope;
                            try {
                                const variableErrors = await backendCommunicator.fireEventAsync("validateVariables", {
                                    data: $scope.effect,
                                    trigger: {
                                        type: triggerType,
                                        id: triggerMeta && triggerMeta.triggerId
                                    }
                                });

                                if (variableErrors && variableErrors.length > 0) {
                                    const firstError = variableErrors[0];

                                    const errorDetails = [];

                                    if (firstError.varname) {
                                        errorDetails.push({
                                            title: "Variable",
                                            message: `$${firstError.varname}`
                                        });
                                    }

                                    if (firstError.message) {
                                        errorDetails.push({
                                            title: "Error",
                                            message: service.capitalize(firstError.message)
                                        });
                                    }

                                    if (firstError.index > -1) {
                                        errorDetails.push({
                                            title: "Argument Index",
                                            message: firstError.index
                                        });
                                    }

                                    if (firstError.character) {
                                        errorDetails.push({
                                            title: "Character",
                                            message: `"${firstError.character}"`
                                        });
                                    }

                                    if (firstError.position) {
                                        errorDetails.push({
                                            title: "Character Position",
                                            message: firstError.position
                                        });
                                    }

                                    if (firstError.rawText) {
                                        errorDetails.push({
                                            title: "Raw Text",
                                            message: `"${firstError.rawText}"`
                                        });
                                    }

                                    if (firstError.dataField) {
                                        errorDetails.push({
                                            title: "UI Field",
                                            message: firstError.dataField
                                        });
                                    }

                                    service.showErrorDetailModal("Replace Variable Error", errorDetails);
                                    return false;
                                }
                            } catch (err) {
                                logger.warn("Error while validating variables.", err);
                            }

                            // validate varialbes
                            return true;
                        }


                        $scope.saveAll = async function() {
                            const valid = await validateEffect();
                            if (!valid) {
                                return;
                            }
                            utilityService.saveAllSlidingModals();
                        };


                        $scope.save = async function() {

                            const valid = await validateEffect();

                            if (!valid) {
                                return;
                            }

                            // clear any toasts
                            ngToast.dismiss();

                            $uibModalInstance.close({
                                action: $scope.isAddMode ? "add" : "update",
                                effect: $scope.effect,
                                index: index
                            });
                        };

                        $scope.copy = function() {
                            objectCopyHelper.copyEffects([$scope.effect]);
                        };

                        $scope.getLabelButtonTextForLabel = function(labelModel) {
                            if (labelModel == null || labelModel.length === 0) {
                                return "Add Label";
                            }
                            return "Edit Label";
                        };

                        $scope.editLabel = () => {
                            const label = $scope.effect.effectLabel;
                            utilityService.openGetInputModal(
                                {
                                    model: label,
                                    label: $scope.getLabelButtonTextForLabel(label),
                                    saveText: "Save Label"
                                },
                                (newLabel) => {
                                    if (newLabel == null || newLabel.length === 0) {
                                        $scope.effect.effectLabel = null;
                                    } else {
                                        $scope.effect.effectLabel = newLabel;
                                    }
                                });
                        };

                        $scope.paste = async function() {
                            if ($scope.hasCopiedEffect()) {
                                $scope.effect = (await objectCopyHelper.getCopiedEffects(triggerType, triggerMeta))[0];
                                effectTypeUpdated();
                            }
                        };

                        $scope.hasCopiedEffect = function() {
                            return (
                                objectCopyHelper.hasCopiedEffects() &&
                                objectCopyHelper.copiedEffectsCount() < 2
                            );
                        };

                        $scope.runEffect = function() {
                            ipcRenderer.send('runEffectsManually', { effects: { list: [$scope.effect] } });
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


                        /*$scope.footerIsStuck = false;
                        //scroll sentinel
                        this.$onInit = function() {

                            $timeout(() => {
                                let observer = new IntersectionObserver(entries => {
                                    let entry = entries[0];

                                    $q.resolve(!entry.isIntersecting, (stuck) => {
                                        $scope.footerIsStuck = stuck;
                                    });
                                });

                                let sentinel = document.querySelector('.effect-footer-sentinel');
                                if (sentinel != null) {
                                    observer.observe(sentinel);
                                }
                            }, 100);
                        };*/
                    },
                    resolveObj: {
                        effect: () => {
                            return effect;
                        },
                        triggerType: () => {
                            return triggerType;
                        },
                        triggerMeta: () => {
                            return triggerMeta;
                        },
                        index: () => {
                            return index;
                        }
                    },
                    closeCallback: closeCallback
                };

                service.showModal(showEditEffectContext);
            };

            service.showConfirmationModal = function(confirmModalRequest) {
                return new Promise((resolve) => {
                    const deleteBoardModalContext = {
                        templateUrl: "./templates/misc-modals/confirmationModal.html",
                        resolveObj: {
                            title: () => {
                                return confirmModalRequest.title;
                            },
                            question: () => {
                                return confirmModalRequest.question;
                            },
                            tip: () => {
                                return confirmModalRequest.tip;
                            },
                            cancelLabel: () => {
                                return confirmModalRequest.cancelLabel;
                            },
                            cancelBtnType: () => {
                                return confirmModalRequest.cancelBtnType;
                            },
                            confirmLabel: () => {
                                return confirmModalRequest.confirmLabel;
                            },
                            confirmBtnType: () => {
                                return confirmModalRequest.confirmBtnType;
                            }
                        },
                        controllerFunc: (
                            $scope,
                            $uibModalInstance,
                            title,
                            question,
                            cancelLabel,
                            cancelBtnType,
                            confirmLabel,
                            confirmBtnType,
                            tip
                        ) => {
                            $scope.title = title;
                            $scope.question = question;
                            $scope.cancelLabel = cancelLabel;
                            $scope.cancelBtnType = cancelBtnType;
                            $scope.confirmLabel = confirmLabel;
                            $scope.confirmBtnType = confirmBtnType;
                            $scope.tip = tip;

                            $scope.confirmed = false;
                            $scope.confirm = function() {
                                $scope.confirmed = true;
                                $uibModalInstance.close();
                            };

                            $scope.dismiss = function() {
                                $uibModalInstance.close();
                                resolve(false);
                            };

                            $scope.$on("modal.closing", function() {
                                resolve($scope.confirmed);
                            });
                        },
                        size: "sm"
                    };
                    service.showModal(deleteBoardModalContext);
                });
            };

            // Watches for an event from main process
            listenerService.registerListener(
                {
                    type: listenerService.ListenerType.INFO
                },
                (infoMessage) => {
                    service.showInfoModal(infoMessage);
                }
            );

            // Watches for an event from main process
            listenerService.registerListener(
                {
                    type: listenerService.ListenerType.ERROR
                },
                (errorMessage) => {
                    service.showErrorModal(errorMessage);
                }
            );

            service.capitalize = function([first, ...rest]) {
                return first.toUpperCase() + rest.join("").toLowerCase();
            };

            service.generateUuid = function() {
                // RFC4122 version 4 compliant
                return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
                    (
                        c ^
            (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
                    ).toString(16)
                );
            };

            service.debounce = function(func, wait, immediate = false) {
                let timeout;

                return function executedFunction() {
                    const context = this;
                    const args = arguments;

                    const later = function() {
                        timeout = null;
                        if (!immediate) {
                            func.apply(context, args);
                        }
                    };

                    const callNow = immediate && !timeout;

                    $timeout.cancel(timeout);

                    timeout = $timeout(later, wait);

                    if (callNow) {
                        func.apply(context, args);
                    }
                };
            };

            return service;
        });
}());
