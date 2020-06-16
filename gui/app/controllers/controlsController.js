"use strict";

(function() {
    angular
        .module("firebotApp")
        .controller("controlsController", function(
            $scope,
            mixplayService,
            utilityService,
            controlHelper,
            gridHelper,
            $timeout,
            settingsService,
            $http,
            backendCommunicator,
            objectCopyHelper,
            ngToast,
            $q
        ) {

            $scope.searchCollapse = true;
            $scope.controlSearch = "";
            $scope.toggleSearchCollapse = () => {
                $scope.searchCollapse = !$scope.searchCollapse;
                $scope.controlSearch = "";
                setTimeout(() => {
                    if (!$scope.searchCollapse) {
                        angular.element(`#control-search`).focus();
                    } else {
                        angular.element(`#control-search`).blur();
                    }
                }, 100);
            };

            $scope.sortableOptions = {
                handle: ".row-text",
                stop: () => {
                    mixplayService.saveCurrentProject();
                }
            };

            $scope.previewEnabled = settingsService.mixPlayPreviewModeEnabled();

            $scope.togglePreviewMode = function() {
                $scope.previewEnabled = !$scope.previewEnabled;
                settingsService.setMixPlayPreviewModeEnabled($scope.previewEnabled);
            };

            $scope.guideLinesEnabled = settingsService.centerGuideLinesEnabled();
            $scope.toggleGuideLines = function() {
                $scope.guideLinesEnabled = !$scope.guideLinesEnabled;
                settingsService.setCenterGuideLinesEnabled($scope.guideLinesEnabled);
            };

            $scope.mps = mixplayService;

            $scope.gridHelper = gridHelper;

            gridHelper.currentGridSize = gridHelper.GridSize.LARGE;

            function getControlPositionForCurrentGrid(control) {
                return $scope.getControlPositionForGrid(control, gridHelper.currentGridSize);
            }

            let lastClickedControl = null;
            $scope.controlMousedown = function(control) {
                lastClickedControl = JSON.parse(JSON.stringify({
                    id: control.id,
                    position: control.position
                }));
            };
            $scope.gridUpdated = function() {

                mixplayService.saveProject(mixplayService.getCurrentProject());

                if (lastClickedControl) {
                    let currentControls = mixplayService.getControlsForCurrentScene();
                    let updatedControl = currentControls.find(c => c.id === lastClickedControl.id);
                    if (updatedControl) {
                        let oldPosition = getControlPositionForCurrentGrid(lastClickedControl);
                        let newPosition = getControlPositionForCurrentGrid(updatedControl);

                        if (oldPosition.x !== newPosition.x ||
                            oldPosition.y !== newPosition.y ||
                            oldPosition.width !== newPosition.width ||
                            oldPosition.height !== newPosition.height) {
                            mixplayService.triggerControlUpdatedEvent(updatedControl.id);
                        }
                    }
                }
            };

            $scope.getSelectedProjectName = function() {
                let currentProject = mixplayService.getCurrentProject();
                if (currentProject != null) {
                    return currentProject.name;
                }
                return "No project selected";
            };

            $scope.currentScenes = [];

            $scope.setCurrentProject = function(projectId) {
                mixplayService.setCurrentProject(projectId);
                $scope.updateControlPositions();
                $scope.currentScenes = $scope.getScenesForSelectedProject();
            };

            $scope.getScenesForSelectedProject = function() {
                let currentProject = mixplayService.getCurrentProject();
                if (currentProject != null) {
                    return currentProject.scenes;
                }
                return [];
            };

            $scope.currentScenes = $scope.getScenesForSelectedProject();

            $scope.disableControlTransitions = true;

            $scope.setSelectedScene = function(sceneId) {
                $scope.disableControlTransitions = true;

                mixplayService.setSelectedScene(sceneId);
                $scope.updateControlPositions();

                $timeout(() => {
                    $scope.disableControlTransitions = false;
                }, 10);
            };

            $scope.shouldEnableTransitions = function() {
                return !$scope.disableControlTransitions;
            };

            $scope.$on('$viewContentLoaded', function() {
                $timeout(() => {
                    $scope.disableControlTransitions = false;
                }, 500);
            });

            $scope.deleteCurrentProject = function() {
                let currentProject = mixplayService.getCurrentProject();
                if (currentProject != null) {

                    utilityService
                        .showConfirmationModal({
                            title: "Delete MixPlay Project",
                            question: `Are you sure you want to delete the MixPlay Project "${currentProject.name}"?`,
                            confirmLabel: "Delete",
                            confirmBtnType: "btn-danger"
                        })
                        .then(confirmed => {
                            if (confirmed) {
                                mixplayService.deleteProject(currentProject.id);
                                $scope.updateControlPositions();
                                $scope.currentScenes = $scope.getScenesForSelectedProject();
                            }
                        });
                }
            };

            $scope.renameCurrentProject = function() {

                let currentProject = mixplayService.getCurrentProject();
                if (currentProject == null) return;

                utilityService.openGetInputModal(
                    {
                        model: currentProject.name,
                        label: "Rename Project",
                        saveText: "Save",
                        validationFn: (value) => {
                            return new Promise(resolve => {
                                if (value == null || value.trim().length < 1) {
                                    resolve(false);
                                } else {
                                    resolve(true);
                                }
                            });
                        },
                        validationText: "Project name cannot be empty."

                    },
                    (newName) => {
                        currentProject.name = newName;
                        mixplayService.saveProject(currentProject);
                    });
            };

            $scope.editControl = function(control) {

                let copiedControl = JSON.parse(angular.toJson(control));

                utilityService.showModal({
                    component: "editControlModal",
                    backdrop: 'static',
                    resolveObj: {
                        control: () => copiedControl,
                        currentGridSize: () => gridHelper.currentGridSize
                    },
                    closeCallback: resp => {
                        mixplayService.saveControlForCurrentScene(resp.control);
                        $scope.updateControlPositions();
                        mixplayService.triggerControlUpdatedEvent(resp.control.id);
                    }
                });
            };

            $scope.copyControl = function(control, duplicate) {
                if (duplicate) {
                    let copiedControl = objectCopyHelper.copyAndReplaceIds(control);
                    control.position = [];
                    mixplayService.saveControlForCurrentScene(copiedControl);
                    mixplayService.triggerControlUpdatedEvent(copiedControl.id);
                } else {
                    objectCopyHelper.copyObject("mixplayControl", control);
                }
            };

            $scope.pasteControl = function() {
                let control = objectCopyHelper.getCopiedObject("mixplayControl");
                if (control) {
                    // verify no position overlap

                    let positions = control.position;
                    for (let i = 0; i < positions.length; i++) {
                        let position = positions[i];

                        let controlsOnGrid = mixplayService.getAllControlPositionsForGridSize(position.size);

                        let obstructed = gridHelper.isAreaObstructed(position.x, position.y, position.width, position.height, controlsOnGrid);
                        if (obstructed) {
                            control.position.splice(i, 1);
                        }
                    }

                    mixplayService.saveControlForCurrentScene(control);
                    mixplayService.triggerControlUpdatedEvent(control.id);
                    $scope.updateControlPositions();
                }
            };

            $scope.hasCopiedControl = function() {
                return objectCopyHelper.hasObjectCopied("mixplayControl");
            };

            $scope.hasCopiedScene = function() {
                return objectCopyHelper.hasObjectCopied("mixplayScene");
            };

            $scope.copyScene = function(scene, duplicate) {
                if (duplicate) {
                    let copiedScene = objectCopyHelper.copyAndReplaceIds(scene);
                    mixplayService.addAdditionalSceneToCurrentProject(copiedScene);
                    $scope.updateControlPositions();
                } else {
                    objectCopyHelper.copyObject("mixplayScene", scene);
                }
            };

            $scope.pasteScene = function() {
                let scene = objectCopyHelper.getCopiedObject("mixplayScene");
                if (!scene) return;
                mixplayService.addAdditionalSceneToCurrentProject(scene);
                $scope.updateControlPositions();
            };

            $scope.deleteScene = function(scene) {
                if (scene != null) {

                    utilityService
                        .showConfirmationModal({
                            title: "Delete Scene",
                            question: `Are you sure you want to delete the Scene "${scene.name}"?`,
                            confirmLabel: "Delete",
                            confirmBtnType: "btn-danger"
                        })
                        .then(confirmed => {
                            if (confirmed) {
                                mixplayService.deleteSceneFromCurrentProject(scene.id);
                                $scope.updateControlPositions();
                            }
                        });
                }
            };

            $scope.deleteControl = function(control) {
                if (control != null) {

                    utilityService
                        .showConfirmationModal({
                            title: "Delete Control",
                            question: `Are you sure you want to delete the Control "${control.name}"?`,
                            confirmLabel: "Delete",
                            confirmBtnType: "btn-danger"
                        })
                        .then(confirmed => {
                            if (confirmed) {
                                mixplayService.deleteControlForCurrentScene(control.id);
                                $scope.updateControlPositions();
                            }
                        });
                }
            };

            $scope.toggleControlActiveState = control => {
                if (control == null) return;
                control.active = !control.active;
                mixplayService.saveControlForCurrentScene(control);
                $scope.updateControlPositions();
                mixplayService.triggerControlUpdatedEvent(control.id);
            };

            $scope.deleteAllControls = function() {
                utilityService
                    .showConfirmationModal({
                        title: "Delete All Controls",
                        question: `Are you sure you want to delete all controls for this scene?`,
                        confirmLabel: "Delete",
                        confirmBtnType: "btn-danger"
                    })
                    .then(confirmed => {
                        if (confirmed) {
                            mixplayService.deleteAllControlsForCurrentScene();
                            $scope.updateControlPositions();
                        }
                    });
            };

            $scope.showCreateMixplayModal = function() {

                utilityService.showModal({
                    component: "createProjectModal",
                    size: 'sm',
                    resolveObj: {},
                    closeCallback: async data => {

                        let { name, shouldImport, importType, devlabProjectId, shareCode, setAsActive } = data;

                        if (shouldImport) {
                            if (importType === "devlab") {
                                await mixplayService.createNewImportedDevLabProject(devlabProjectId, name, setAsActive);
                            } else if (importType === "sharecode") {
                                await mixplayService.createNewShareCodeProject(shareCode, name, setAsActive);
                            }
                        } else {
                            mixplayService.createNewProject(name, setAsActive);
                        }
                        $scope.currentScenes = $scope.getScenesForSelectedProject();
                        $scope.updateControlPositions();
                    }
                });
            };

            $scope.shareCurrentMixPlayProject = async () => {
                let projectId = mixplayService.getCurrentProjectId();
                if (projectId == null) return;

                let shareCode = await backendCommunicator.fireEventAsync("getMixPlayProjectShareCode", projectId);
                if (shareCode == null) {
                    ngToast.create("Unable to share MixPlay project.");
                } else {
                    utilityService.showModal({
                        component: "copyShareCodeModal",
                        size: 'sm',
                        resolveObj: {
                            shareCode: () => shareCode,
                            title: () => "MixPlay Share Code",
                            message: () => "Share the below code so others can import this MixPlay Project."
                        }
                    });
                }
            };

            $scope.showCreateSceneModal = function() {

                utilityService.openGetInputModal(
                    {
                        model: "",
                        label: "New Scene Name",
                        saveText: "Add",
                        validationFn: (value) => {
                            return new Promise(resolve => {
                                if (value == null || value.trim().length < 1) {
                                    resolve(false);
                                } else {
                                    resolve(true);
                                }
                            });
                        },
                        validationText: "Scene name cannot be empty."

                    },
                    (name) => {
                        mixplayService.addNewSceneToCurrentProject(name);
                        $scope.updateControlPositions();
                    });
            };

            $scope.getControlPositionForGrid = function(control, gridSize = "large") {
                let position = control.position.find(p => p.size === gridSize);
                return position || {};
            };

            $scope.getAllControlPositionsForGridSize = function(size = "large") {
                //get all controls for this scene
                let allControls = mixplayService.getControlsForCurrentScene();

                //filter to just controls that have saved positions for this size
                return allControls
                    .filter(c => c.position.some(p => p.size === size))
                    .map(c => {
                        return {
                            position: c.position.find(p => p.size === size),
                            control: c
                        };
                    });
            };

            $scope.controlPositions = $scope.getAllControlPositionsForGridSize(gridHelper.currentGridSize);

            $scope.currentControls = mixplayService.getControlsForCurrentScene();

            $scope.updateControlPositions = function() {
                $scope.controlPositions = $scope.getAllControlPositionsForGridSize(gridHelper.currentGridSize);
                $scope.currentControls = mixplayService.getControlsForCurrentScene();
            };

            function updateGridSize() {
                let gridDimensions = gridHelper.GridSizes[gridHelper.currentGridSize];
                let grid = angular.element("#controlGrid");
                grid.attr("col-count", gridDimensions.width);
                grid.attr("row-count", gridDimensions.height);
            }

            updateGridSize();

            let copiedDimensions = {};

            let hasCopiedDimensionsForControlKind = (kind) => {
                return copiedDimensions[kind] != null;
            };

            let setCopiedDimensionsForControlKind = (control) => {
                if (control == null || control.kind == null) return;
                let position = control.position && control.position.find(p => p.size === gridHelper.currentGridSize);
                if (!position) return;
                return copiedDimensions[control.kind] = { width: position.width, height: position.height };
            };

            let getCopiedDimensionsForControlKind = (kind) => {
                return copiedDimensions[kind];
            };

            let applyCopiedDimensionsToControl = (control) => {

                if (control == null || control.kind == null) return;

                let copiedDimensions = getCopiedDimensionsForControlKind(control.kind);

                if (copiedDimensions == null) return;

                // verify no position overlap
                let position = control.position && control.position.find(p => p.size === gridHelper.currentGridSize);
                if (!position) return;

                let controlsOnGrid = mixplayService.getAllControlPositionsForGridSize(gridHelper.currentGridSize)
                    .filter(p => !(p.x === position.x && p.y === position.y));

                let gridDimensions = gridHelper.GridSizes[gridHelper.currentGridSize];

                let obstructed = false;
                if (position.x + copiedDimensions.width > gridDimensions.width || position.y + copiedDimensions.height > gridDimensions.height) {
                    obstructed = true;
                }
                if (gridHelper.isAreaObstructed(position.x, position.y, copiedDimensions.width, copiedDimensions.height, controlsOnGrid)) {
                    obstructed = true;
                }

                if (obstructed) {
                    ngToast.create("Unable to apply copied dimensions as theres not enough space either to the right of or below the control.");
                    return;
                }

                position.width = copiedDimensions.width;
                position.height = copiedDimensions.height;

                mixplayService.saveControlForCurrentScene(control);
                mixplayService.triggerControlUpdatedEvent(control.id);
                $scope.updateControlPositions();
            };

            let copiedStylings = {};

            let hasCopiedStylingsForControlKind = (kind) => {
                return copiedStylings[kind] != null;
            };

            let setCopiedStylingsForControlKind = (control) => {
                if (control == null || control.kind == null) return;

                let stylings = {};
                if (control.kind === "button") {
                    stylings.textSize = control.mixplay.textSize;
                    stylings.textColor = control.mixplay.textColor;
                    stylings.accentColor = control.mixplay.accentColor;
                    stylings.borderColor = control.mixplay.borderColor;
                    stylings.focusColor = control.mixplay.focusColor;
                    stylings.backgroundColor = control.mixplay.backgroundColor;
                    stylings.backgroundImage = control.mixplay.backgroundImage;
                }

                if (control.kind === "label") {
                    stylings.textSize = control.mixplay.textSize;
                    stylings.textColor = control.mixplay.textColor;
                    stylings.bold = control.mixplay.bold;
                    stylings.italic = control.mixplay.italic;
                    stylings.underline = control.mixplay.underline;
                }

                return copiedStylings[control.kind] = stylings;
            };

            let getCopiedStylingsForControlKind = (kind) => {
                return copiedStylings[kind];
            };

            let applyCopiedStylingsToControl = (control) => {

                let copiedStylings = getCopiedStylingsForControlKind(control.kind);

                if (copiedStylings == null) return;

                if (control.kind === "button") {
                    control.mixplay.textSize = copiedStylings.textSize;
                    control.mixplay.textColor = copiedStylings.textColor;
                    control.mixplay.accentColor = copiedStylings.accentColor;
                    control.mixplay.borderColor = copiedStylings.borderColor;
                    control.mixplay.focusColor = copiedStylings.focusColor;
                    control.mixplay.backgroundColor = copiedStylings.backgroundColor;
                    control.mixplay.backgroundImage = copiedStylings.backgroundImage;
                }

                if (control.kind === "label") {
                    control.mixplay.textSize = copiedStylings.textSize;
                    control.mixplay.textColor = copiedStylings.textColor;
                    control.mixplay.bold = copiedStylings.bold;
                    control.mixplay.italic = copiedStylings.italic;
                    control.mixplay.underline = copiedStylings.underline;
                }

                mixplayService.saveControlForCurrentScene(control);
                mixplayService.triggerControlUpdatedEvent(control.id);
            };

            $scope.controlMenuOptions = (control) => {
                let menuOptions = [
                    {
                        html: `<a href ><i class="far fa-pen" style="margin-right: 10px;"></i> Edit control</a>`,
                        click: function ($itemScope) {
                            let control = $itemScope.control.control;
                            $scope.editControl(control);
                        }
                    },
                    {
                        html: `<a href><i class="fas fa-th-large" style="margin-right: 10px;"></i> Remove From Grid</a>`,
                        click: function ($itemScope) {
                            let controlId = $itemScope.control.control.id;
                            let control = mixplayService.getControlsForCurrentScene().find(c => c.id === controlId);
                            if (control) {
                                $scope.removeControlFromGrid(control);
                            }
                        }
                    }
                ];

                if (control.kind === "button" || control.kind === "textbox" || control.kind === "joystick") {

                    menuOptions.push({
                        html: `<a href ><i class="fas fa-vial" style="margin-right: 10px;"></i> Test Effects</a>`,
                        click: function ($itemScope) {
                            let currentControl = $itemScope.control.control;
                            ipcRenderer.send('runEffectsManually', currentControl.effects || { list: [] });
                        }
                    });

                    menuOptions.push({
                        html: `<a href ><i class="far ${control.active ? 'fa-toggle-off' : 'fa-toggle-on'}" style="margin-right: 10px;"></i> ${control.active ? 'Disable' : 'Enable'}</a>`,
                        click: function ($itemScope) {
                            let currentControl = $itemScope.control.control;
                            $scope.toggleControlActiveState(currentControl);
                        }
                    });
                }

                menuOptions.push({
                    html: `<a href style="color: #fb7373;"><i class="far fa-trash-alt" style="margin-right: 10px;"></i> Delete Control</a>`,
                    click: function ($itemScope) {
                        let control = $itemScope.control.control;
                        $scope.deleteControl(control);
                    }
                });

                let resizable = $scope.getControlSettings(control.kind).resizable;

                if (resizable) {
                    menuOptions.push({
                        html: `<a href style="display: flex; justify-content: space-between;align-items: center;">
                                    <span><i class="far fa-arrows-h" style="margin-right: 10px;"></i> Dimensions</span>
                                    <i class="far fa-chevron-right"></i>
                               </a>`,
                        children: [
                            {
                                html: `<a href><i class="far fa-plus-square" style="margin-right: 10px;"></i> Apply Copied</a>`,
                                click: function ($itemScope) {
                                    let control = $itemScope.control.control;
                                    if (hasCopiedDimensionsForControlKind(control.kind)) {
                                        applyCopiedDimensionsToControl(control);
                                    }
                                },
                                enabled: hasCopiedDimensionsForControlKind(control.kind)
                            },
                            {
                                html: `<a href><i class="far fa-copy" style="margin-right: 10px;"></i> Copy Current</a>`,
                                click: function ($itemScope) {
                                    let control = $itemScope.control.control;
                                    setCopiedDimensionsForControlKind(control);
                                }
                            }
                        ],
                        hasTopDivider: true
                    });
                }

                if ((control.kind === "button" || control.kind === "label") && $scope.previewEnabled) {
                    menuOptions.push({
                        html: `<a href style="display: flex; justify-content: space-between;align-items: center;">
                                    <span><i class="fas fa-paint-brush" style="margin-right: 10px;"></i> Stylings</span>
                                    <i class="far fa-chevron-right"></i>
                               </a>`,
                        children: [
                            {
                                html: `<a href><i class="far fa-plus-square" style="margin-right: 10px;"></i> Apply Copied</a>`,
                                click: function ($itemScope) {
                                    let control = $itemScope.control.control;
                                    if (hasCopiedStylingsForControlKind(control.kind)) {
                                        applyCopiedStylingsToControl(control);
                                    }
                                },
                                enabled: hasCopiedStylingsForControlKind(control.kind)
                            },
                            {
                                html: `<a href><i class="far fa-copy" style="margin-right: 10px;"></i> Copy Current</a>`,
                                click: function ($itemScope) {
                                    let control = $itemScope.control.control;
                                    setCopiedStylingsForControlKind(control);
                                }
                            }
                        ]
                    });
                }


                return menuOptions;
            };

            $scope.cooldownGroupsMenuOptions = [
                {
                    html: `<a href><i class="far fa-pen" style="margin-right: 10px;"></i> Edit</a>`,
                    click: function ($itemScope) {
                        let cooldownGroup = $itemScope.cooldownGroup;
                        $scope.showAddOrEditCooldownGroupModal(cooldownGroup);
                    }
                },
                {
                    html: `<a href style="color: #fb7373;"><i class="far fa-trash-alt" style="margin-right: 10px;"></i> Delete</a>`,
                    click: function ($itemScope) {
                        let cooldownGroup = $itemScope.cooldownGroup;
                        $scope.showDeleteCooldownGroupModal(cooldownGroup);
                    }
                }
            ];

            $scope.gridSizeChanged = function(size) {
                gridHelper.currentGridSize = size;
                updateGridSize();
                $scope.updateControlPositions();
            };

            $scope.addControlToGrid = function(control) {
                mixplayService.addControlToGrid(control, gridHelper.currentGridSize);
                $scope.updateControlPositions();
            };

            $scope.removeControlFromGrid = function(control) {
                utilityService.showConfirmationModal({
                    title: "Remove From Grid",
                    question: `Are you sure you want to remove this control from the ${gridHelper.currentGridSize} grid? (This won't delete the control)`,
                    confirmLabel: "Remove",
                    confirmBtnType: "btn-danger"
                }).then(confirmed => {
                    if (confirmed) {
                        mixplayService.removeControlFromGrid(control, gridHelper.currentGridSize);
                        $scope.updateControlPositions();
                    }
                });
            };

            $scope.removeControlsFromGrid = function(gridSize) {

                const currentSceneName = mixplayService.getCurrentSceneName();
                const gridName = gridSize ? `the ${gridSize} grid` : "all grids";

                utilityService.showConfirmationModal({
                    title: "Remove From Grid",
                    question: `Are you sure you want to remove all controls in scene "${currentSceneName}" from ${gridName}? (This won't delete the controls)`,
                    confirmLabel: "Remove",
                    confirmBtnType: "btn-danger"
                }).then(confirmed => {
                    if (confirmed) {
                        mixplayService.removeControlsFromGrid(gridSize);
                        $scope.updateControlPositions();
                    }
                });

            };

            $scope.controlIsOnGrid = function(control) {
                return control.position.some(p => p.size === gridHelper.currentGridSize);
            };

            let hightlightedControl = "";

            $scope.addOrRemoveControlToGrid = function(control) {
                let alreadyAdded = control.position.some(p => p.size === gridHelper.currentGridSize);
                if (alreadyAdded) {
                    $scope.removeControlFromGrid(control);
                } else {
                    $scope.addControlToGrid(control);
                }
                hightlightedControl = null;
            };

            $scope.setHighlightedControl = utilityService.debounce((id) => {
                hightlightedControl = id;
            }, 75);

            $scope.controlShouldHighlight = function(id) {
                return hightlightedControl === id;
            };
            $scope.clearHighlight = function() {
                hightlightedControl = null;
                $scope.setHighlightedControl(null);
            };


            $scope.getControlSettings = function(type) {
                return controlHelper.controlSettings[type];
            };

            $scope.getControlIconForKind = function(kind) {
                let controlModel = controlHelper.controlKinds.find(c => c.kind === kind);
                if (controlModel) {
                    return controlModel.iconClass;
                }
                return "";
            };

            const COVER_GRADIENT = "linear-gradient(to top, rgba(19, 24, 32, 0.8), rgba(18, 23, 32, 0.95))";
            let previewBackgroundCss = `${COVER_GRADIENT}, url(https://mixer.com/_latest/assets/img/backgrounds/generic-001.jpg)`;
            function getPreviewBackgroundCss() {
                let accounts = backendCommunicator.fireEventSync("getAccounts");

                const channelId = accounts.streamer.channelId;

                $http.get(`https://mixer.com/api/v1/channels/${channelId}`)
                    .then(resp => {
                        if (resp.status === 200) {
                            previewBackgroundCss = `${COVER_GRADIENT}, url(${resp.data.cover.url})`;
                        }
                    }, () => {

                    });
            }
            getPreviewBackgroundCss();

            $scope.getPreviewStyles = function() {
                if ($scope.previewEnabled) {
                    return {
                        "background-image": previewBackgroundCss
                    };
                }
                return {};
            };

            $scope.showRenameSceneModal = function(scene) {
                utilityService.openGetInputModal(
                    {
                        model: scene.name,
                        label: "Rename Scene",
                        saveText: "Save",
                        validationFn: (value) => {
                            return new Promise(resolve => {
                                if (value == null || value.trim().length < 1) {
                                    resolve(false);
                                } else {
                                    resolve(true);
                                }
                            });
                        },
                        validationText: "Scene name cannot be empty."

                    },
                    (newName) => {
                        mixplayService.renameScene(scene.id, newName);
                    });
            };


            $scope.showCreateControlModal = function() {

                utilityService.showModal({
                    component: "createControlModal",
                    size: 'sm',
                    resolveObj: {},
                    closeCallback: response => {
                        let name = response.name,
                            kind = response.kind,
                            addToGrids = response.addToGrids;

                        $q.when(mixplayService.createControlForCurrentScene(name, kind, addToGrids))
                            .then(() => {
                                $scope.updateControlPositions();
                            });
                    }
                });
            };


            /**
             * COOLDOWN GROUPS
             */

            $scope.getCooldownGroupsForSelectedProject = function() {
                let currentProject = mixplayService.getCurrentProject();
                if (currentProject != null) {
                    return currentProject.cooldownGroups || [];
                }
                return [];
            };

            $scope.showAddOrEditCooldownGroupModal = function(cooldownGroup) {

                utilityService.showModal({
                    component: "addOrEditCooldownGroupModal",
                    resolveObj: {
                        cooldownGroup: () => cooldownGroup
                    },
                    closeCallback: resp => {
                        let { action, cooldownGroup } = resp;

                        let cooldownGroups = $scope.getCooldownGroupsForSelectedProject();

                        switch (action) {
                        case "add":
                            cooldownGroups.push(cooldownGroup);
                            break;
                        case "update": {
                            let cooldownIndex = cooldownGroups.findIndex(cg => cg.id === cooldownGroup.id);
                            if (cooldownIndex > -1) {
                                cooldownGroups[cooldownIndex] = cooldownGroup;
                            }
                            break;
                        }
                        case "delete": {
                            let cooldownIndex = cooldownGroups.findIndex(cg => cg.id === cooldownGroup.id);
                            if (cooldownIndex > -1) {
                                cooldownGroups.splice(cooldownIndex, 1);
                            }
                            break;
                        }
                        }
                        mixplayService.saveCooldownGroupsForCurrentProject(cooldownGroups);
                    }
                });

                $scope.showDeleteCooldownGroupModal = function(cooldownGroup) {
                    utilityService
                        .showConfirmationModal({
                            title: "Delete Cooldown Group",
                            question: `Are you sure you want to delete the cooldown group '${cooldownGroup.name}'?`,
                            confirmLabel: "Delete",
                            confirmBtnType: "btn-danger"
                        })
                        .then(confirmed => {
                            if (confirmed) {
                                let cooldownGroups = $scope.getCooldownGroupsForSelectedProject();
                                let cooldownIndex = cooldownGroups.findIndex(cg => cg.id === cooldownGroup.id);
                                if (cooldownIndex > -1) {
                                    cooldownGroups.splice(cooldownIndex, 1);
                                    mixplayService.saveCooldownGroupsForCurrentProject(cooldownGroups);
                                }
                            }
                        });
                };
            };
        });
}());
