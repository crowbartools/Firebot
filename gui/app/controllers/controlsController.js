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
            $timeout
        ) {

            $scope.mps = mixplayService;

            $scope.currentGridSize = gridHelper.GridSize.LARGE;

            $scope.gridUpdated = function() {
                /*for (let controlData of $scope.controlPositions) {
                    let indexOfPosition = controlData.control.position.findIndex(p => p.size === controlData.position.size);
                    if (indexOfPosition > -1) {
                        console.log("UPDATIING CONTROL");
                        controlData.control.position[indexOfPosition] = controlData.position;
                        console.log(controlData.control);
                    }
                }*/
                mixplayService.saveProject(mixplayService.getCurrentProject());
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

            $scope.editControl = function(control) {

                let copiedControl = JSON.parse(angular.toJson(control));

                utilityService.showModal({
                    component: "editControlModal",
                    resolveObj: {
                        control: () => copiedControl
                    },
                    closeCallback: control => {
                        mixplayService.saveControlForCurrentScene(control);
                        $scope.updateControlPositions();
                    }
                });
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


            $scope.showCreateMixplayModal = function() {

                utilityService.openGetInputModal(
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
                    });
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

            $scope.controlPositions = $scope.getAllControlPositionsForGridSize($scope.currentGridSize);

            $scope.updateControlPositions = function() {
                $scope.controlPositions = $scope.getAllControlPositionsForGridSize($scope.currentGridSize);
            };

            function updateGridSize() {
                let gridDimensions = gridHelper.GridSizes[$scope.currentGridSize];
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
                        console.log(control);
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

            $scope.gridSizeChanged = function(size) {
                $scope.currentGridSize = size;
                updateGridSize();
                $scope.updateControlPositions();
            };

            $scope.addControlToGrid = function(control) {
                mixplayService.addControlToGrid(control, $scope.currentGridSize);
                $scope.updateControlPositions();
            };

            $scope.removeControlFromGrid = function(control) {
                control.position = control.position.filter(p => p.size !== $scope.currentGridSize);
                $scope.updateControlPositions();
                mixplayService.saveProject(mixplayService.getCurrentProject());
            };

            $scope.controlIsOnGrid = function(control) {
                return control.position.some(p => p.size === $scope.currentGridSize);
            };

            let hightlightedControl = "";

            $scope.addOrRemoveControlToGrid = function(control) {
                let alreadyAdded = control.position.some(p => p.size === $scope.currentGridSize);
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
        });
}());
