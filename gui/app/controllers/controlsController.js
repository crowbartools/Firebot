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
            objectCopyHelper
        ) {

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

            $scope.setCurrentProject = function(projectId) {
                mixplayService.setCurrentProject(projectId);
                $scope.updateControlPositions();
            };

            $scope.getScenesForSelectedProject = function() {
                let currentProject = mixplayService.getCurrentProject();
                if (currentProject != null) {
                    return currentProject.scenes;
                }
                return [];
            };

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
                    let controlsOnGrid = mixplayService.getAllControlPositionsForGridSize(gridHelper.currentGridSize);
                    let positions = control.position;
                    for (let i = 0; i < positions.length; i++) {
                        let position = positions[i];
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

                        let { name, importDevLab, devlabProjectId } = data;

                        if (importDevLab) {
                            await mixplayService.createNewImportedDevLabProject(devlabProjectId, name);
                        } else {
                            mixplayService.createNewProject(name);
                        }
                        $scope.updateControlPositions();
                    }
                });
                /*utilityService.openGetInputModal(
                    {
                        model: "",
                        label: "New Project Name",
                        saveText: "Create",
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
                    (name) => {
                        mixplayService.createNewProject(name);
                        $scope.updateControlPositions();
                    });*/
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

            $scope.updateControlPositions = function() {
                $scope.controlPositions = $scope.getAllControlPositionsForGridSize(gridHelper.currentGridSize);
            };

            function updateGridSize() {
                let gridDimensions = gridHelper.GridSizes[gridHelper.currentGridSize];
                let grid = angular.element("#controlGrid");
                grid.attr("col-count", gridDimensions.width);
                grid.attr("row-count", gridDimensions.height);
            }

            updateGridSize();

            $scope.controlMenuOptions = [
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
                },
                {
                    html: `<a href style="color:red"><i class="far fa-trash-alt" style="margin-right: 10px;"></i> Delete Control</a>`,
                    click: function ($itemScope) {
                        let control = $itemScope.control.control;
                        $scope.deleteControl(control);
                    }
                }
            ];

            $scope.cooldownGroupsMenuOptions = [
                {
                    html: `<a href><i class="far fa-pen" style="margin-right: 10px;"></i> Edit</a>`,
                    click: function ($itemScope) {
                        let index = $itemScope.$index;
                        $scope.showAddOrEditCooldownGroupModal(index);
                    }
                },
                {
                    html: `<a href style="color:red"><i class="far fa-trash-alt" style="margin-right: 10px;"></i> Delete</a>`,
                    click: function ($itemScope) {
                        let index = $itemScope.$index;
                        let cooldownGroup = $itemScope.cooldownGroup;
                        $scope.showDeleteCooldownGroupModal(index, cooldownGroup.name);
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
                mixplayService.removeControlFromGrid(control, gridHelper.currentGridSize);
                $scope.updateControlPositions();
            };

            $scope.removeControlsFromGrid = function(gridSize) {

                const currentSceneName = mixplayService.getCurrentSceneName();
                const gridName = gridSize ? `the ${gridSize} grid` : "all grids";

                utilityService.showConfirmationModal({
                    title: "Remove From Grid",
                    question: `Are you sure you want to remove all controls in scene "${currentSceneName}" from ${gridName}?`,
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
                    closeCallback: control => {
                        let name = control.name,
                            kind = control.kind;

                        mixplayService.createControlForCurrentScene(name, kind);
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

            $scope.showAddOrEditCooldownGroupModal = function(index) {

                let cooldownGroup = null;
                if (index !== null && index !== undefined) {
                    let cooldownGroups = $scope.getCooldownGroupsForSelectedProject();
                    cooldownGroup = cooldownGroups[index];
                }

                utilityService.showModal({
                    component: "addOrEditCooldownGroupModal",
                    resolveObj: {
                        index: () => index,
                        cooldownGroup: () => cooldownGroup
                    },
                    closeCallback: resp => {
                        let { action, index, cooldownGroup } = resp;

                        let cooldownGroups = $scope.getCooldownGroupsForSelectedProject();

                        switch (action) {
                        case "add":
                            cooldownGroups.push(cooldownGroup);
                            break;
                        case "update":
                            cooldownGroups[index] = cooldownGroup;
                            break;
                        case "delete":
                            cooldownGroups.splice(index, 1);
                            break;
                        }
                        mixplayService.saveCooldownGroupsForCurrentProject(cooldownGroups);
                    }
                });

                $scope.showDeleteCooldownGroupModal = function(index, name) {
                    utilityService
                        .showConfirmationModal({
                            title: "Delete Cooldown Group",
                            question: `Are you sure you want to delete the cooldown group '${name}'?`,
                            confirmLabel: "Delete",
                            confirmBtnType: "btn-danger"
                        })
                        .then(confirmed => {
                            if (confirmed) {
                                let cooldownGroups = $scope.getCooldownGroupsForSelectedProject();
                                cooldownGroups.splice(index, 1);
                                mixplayService.saveCooldownGroupsForCurrentProject(cooldownGroups);
                            }
                        });
                };
            };
        });
}());
