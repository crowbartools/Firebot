"use strict";

(function() {

    const uuidv1 = require("uuid/v1");

    angular
        .module("firebotApp")
        .factory("mixplayService", function(backendCommunicator, logger, settingsService,
            gridHelper, controlHelper, ngToast) {
            let service = {};

            let projects = [];
            let activeProjectId = settingsService.getActiveMixplayProjectId();
            let currentProjectId = activeProjectId;

            let selectedSceneId;

            service.getProjectById = function(id) {
                return projects.find(p => p.id === id);
            };

            service.getActiveMixplayProjectId = function() {
                return activeProjectId;
            };

            service.setActiveMixplayProjectId = function(id) {
                activeProjectId = id;
                settingsService.setActiveMixplayProjectId(id);
            };

            service.projectIsActive = function(id) {
                return id === activeProjectId;
            };

            service.getActiveProject = function() {
                if (activeProjectId != null) {
                    return service.getProjectById(activeProjectId);
                }
                return null;
            };

            service.getCurrentProjectId = function() {
                return currentProjectId;
            };

            service.getCurrentProject = function() {
                if (currentProjectId != null) {
                    return service.getProjectById(currentProjectId);
                }
                return null;
            };

            function selectFirstScene() {
                let currentProject = service.getCurrentProject();
                if (currentProject != null) {
                    if (currentProject.scenes.length > 0) {
                        selectedSceneId = currentProject.scenes[0].id;
                    }
                }
            }

            service.setCurrentProject = function(id) {
                currentProjectId = id;
                selectFirstScene();
            };

            service.hasCurrentProject = function() {
                return currentProjectId != null;
            };

            service.deleteProject = function(id) {
                backendCommunicator.fireEvent("deleteProject", id);
                projects = projects.filter(p => p.id !== id);

                let activeProjectId = settingsService.getActiveMixplayProjectId();
                if (activeProjectId === id) {
                    if (projects.length > 0) {
                        service.setActiveMixplayProjectId(projects[0].id);
                    } else {
                        service.setActiveMixplayProjectId(null);
                    }
                }

                if (currentProjectId === id) {
                    if (projects.length > 0) {
                        currentProjectId = projects[0].id;
                        selectFirstScene();
                    } else {
                        currentProjectId = null;
                    }
                }
            };

            function loadProjects() {
                projects = backendCommunicator.fireEventSync("getAllProjects");
                selectFirstScene();
                if (projects.length > 0 && currentProjectId == null) {
                    currentProjectId = projects[0].id;
                }
            }

            loadProjects();

            backendCommunicator.on("mixplay-projects-updated", () => {
                loadProjects();
                activeProjectId = settingsService.getActiveMixplayProjectId();
                currentProjectId = activeProjectId;
                selectFirstScene();
            });

            service.createNewProject = function(name, setAsActive = false) {
                let newProject = backendCommunicator.fireEventSync("createNewProject", name);
                projects.push(newProject);
                currentProjectId = newProject.id;
                if (activeProjectId == null || setAsActive) {
                    service.setActiveMixplayProjectId(newProject.id);
                }
                selectFirstScene();
            };

            service.createNewImportedDevLabProject = async function(devlabId, name, setAsActive = false) {
                let newProject = await backendCommunicator.fireEventAsync("createNewDevLabImportProject", {
                    devLabId: devlabId,
                    projectName: name
                });
                if (newProject != null) {
                    projects.push(newProject);
                    currentProjectId = newProject.id;
                    if (activeProjectId == null || setAsActive) {
                        service.setActiveMixplayProjectId(newProject.id);
                    }
                    selectFirstScene();
                }

            };

            service.saveProject = function(project) {
                if (project == null) return;

                // remove any angular fields
                let cleanedProject = JSON.parse(angular.toJson(project));

                backendCommunicator.fireEvent("saveProject", cleanedProject);
            };

            service.triggerControlUpdatedEvent = function(controlId) {
                if (currentProjectId !== activeProjectId) return;
                backendCommunicator.fireEvent("controlUpdated", controlId);
            };

            service.renameScene = function(sceneId, newName) {
                let currentProject = service.getCurrentProject();
                if (currentProject == null) return;
                let scene = currentProject.scenes.find(s => s.id === sceneId);
                if (scene) {
                    scene.name = newName;
                    service.saveProject(currentProject);
                }
            };

            service.addNewSceneToCurrentProject = function(sceneName) {
                let currentProject = service.getCurrentProject();
                if (currentProject != null) {

                    let newId = uuidv1();

                    let newScene = {
                        id: newId,
                        name: sceneName,
                        controls: []
                    };

                    if (currentProject.scenes.length < 1) {
                        currentProject.defaultSceneId = newId;
                        selectedSceneId = newId;
                    }

                    currentProject.scenes.push(newScene);

                    service.saveProject(currentProject);
                }
            };

            service.addAdditionalSceneToCurrentProject = function(scene) {
                let currentProject = service.getCurrentProject();
                if (currentProject != null) {
                    currentProject.scenes.push(scene);
                    service.saveProject(currentProject);
                }
            };

            service.deleteSceneFromCurrentProject = function(id) {
                let currentProject = service.getCurrentProject();
                if (currentProject != null) {

                    let sceneToDelete = currentProject.scenes.find(s => s.id === id);

                    if (sceneToDelete) {
                        currentProject.scenes = currentProject.scenes.filter(s => s.id !== id);

                        if (currentProject.defaultSceneId === id) {
                            if (currentProject.scenes.length > 0) {
                                currentProject.defaultSceneId = currentProject.scenes[0].id;
                            } else {
                                currentProject.defaultSceneId = null;
                            }
                        }

                        if (selectedSceneId === id) {
                            if (currentProject.scenes.length > 0) {
                                selectedSceneId = currentProject.scenes[0].id;
                            } else {
                                selectedSceneId = null;
                            }
                        }

                    }

                    service.saveProject(currentProject);
                }
            };

            function getCurrentScene() {
                let currentProject = service.getCurrentProject();
                if (currentProject != null) {
                    return currentProject.scenes.find(s => s.id === selectedSceneId);
                }
                return null;
            }

            service.getCurrentSceneName = function() {
                const currentScene = getCurrentScene();
                return currentScene && currentScene.name;
            };

            service.hasSceneSelected = function() {
                let currentProject = service.getCurrentProject();
                if (currentProject != null) {
                    if (currentProject.scenes.length > 0 &&
                        currentProject.scenes.find(s => s.id === selectedSceneId)) {
                        return true;
                    }
                }
                return false;
            };

            function getGridDimensions(gridSize = "") {
                gridSize = gridSize.toLowerCase();
                switch (gridSize) {
                case "small":
                    return { w: 30, h: 40 };
                case "medium":
                    return { w: 45, h: 25 };
                case "large":
                    return { w: 80, h: 20 };
                }
                return null;
            }

            service.getAllControlPositionsForGridSize = function(size = "large") {
                //get all controls for this scene
                let allControls = service.getControlsForCurrentScene();

                //filter to just controls that have saved positions for this size
                return allControls
                    .filter(c => c.position.some(p => p.size === size))
                    .map(c => c.position.find(p => p.size === size));
            };

            service.removeControlFromGrid = function(control, gridSize) {
                control.position = control.position.filter(p => p.size !== gridSize);
                service.saveProject(service.getCurrentProject());

                backendCommunicator.fireEvent("controlUpdated", control.id);
            };

            service.removeControlsFromGrid = function(gridSize) {
                if (!service.hasSceneSelected()) return;
                let allControls = service.getControlsForCurrentScene();
                allControls.forEach(c => {
                    if (gridSize == null) {
                        c.position = [];
                    } else {
                        c.position = c.position.filter(p => p.size !== gridSize);
                    }
                });
                service.saveProject(service.getCurrentProject());

                if (currentProjectId !== activeProjectId) return;
                let currentScene = getCurrentScene();
                backendCommunicator.fireEvent("controlsUpdated", {
                    sceneId: currentScene.id,
                    controls: allControls
                });
            };

            service.addControlToGrid = function(control, gridSize) {
                let controlAlreadyOnGrid = control.position.some(p => p.size === gridSize);
                if (controlAlreadyOnGrid) return;

                let controlSettings = controlHelper.controlSettings[control.kind];

                if (controlSettings == null || !controlSettings.grid) return;

                let gridDimensions = getGridDimensions(gridSize);

                if (!gridDimensions) return;

                let controlDimensions = {
                    h: controlSettings.minSize.height,
                    w: controlSettings.minSize.width
                };

                let controlsOnGrid = service.getAllControlPositionsForGridSize(gridSize);

                let openArea = gridHelper.findOpenArea(
                    gridDimensions.w,
                    gridDimensions.h,
                    controlDimensions.w,
                    controlDimensions.h,
                    controlsOnGrid);

                if (openArea != null) {
                    let newPosition = {
                        size: gridSize,
                        width: controlDimensions.w,
                        height: controlDimensions.h,
                        x: openArea.x,
                        y: openArea.y
                    };

                    control.position.push(newPosition);

                    logger.info("Added control to grid!");
                    service.saveProject(service.getCurrentProject());

                    backendCommunicator.fireEvent("controlUpdated", control.id);

                } else {
                    ngToast.create(`Could not find enough space in the grid to place control (${controlDimensions.w}w x ${controlDimensions.h}h)`);
                }
            };

            service.updateControlPosition = function(controlId, position) {
                if (controlId == null || position == null) return;

                let currentScene = getCurrentScene();
                if (currentScene) {
                    let control = currentScene.controls.find(c => c.id === controlId);
                    if (control) {
                        control.position = control.position.filter(p => p.size !== position.size);
                        control.position.push(position);
                    }
                }
            };

            service.createControlForCurrentScene = function(controlName, controlKind = "button") {
                let currentProject = service.getCurrentProject();
                if (currentProject != null) {
                    let currentScene = currentProject.scenes.find(s => s.id === selectedSceneId);
                    if (currentScene != null) {
                        let newId = uuidv1();
                        let newControl = {
                            id: newId,
                            name: controlName,
                            kind: controlKind,
                            position: [],
                            mixplay: {},
                            active: true
                        };
                        currentScene.controls.push(newControl);

                        service.saveProject(currentProject);

                        if (currentProjectId !== activeProjectId) return;

                        backendCommunicator.fireEvent("controlAdded", {
                            sceneId: currentScene.id, newControl
                        });
                    }
                }
            };

            service.saveControlForCurrentScene = function(control) {
                let currentScene = getCurrentScene();
                if (!currentScene) return;

                let indexOfControl = currentScene.controls.findIndex(c => c.id === control.id);

                if (indexOfControl !== -1) {
                    currentScene.controls[indexOfControl] = control;
                } else {
                    currentScene.controls.push(control);
                }

                service.saveProject(service.getCurrentProject());
            };

            service.deleteControlForCurrentScene = function(controlId) {
                let currentScene = getCurrentScene();
                if (currentScene) {
                    currentScene.controls = currentScene.controls.filter(c => c.id !== controlId);
                    service.saveProject(service.getCurrentProject());

                    if (currentProjectId !== activeProjectId) return;
                    backendCommunicator.fireEvent("controlsRemoved", {
                        sceneId: currentScene.id,
                        controlIds: [controlId]
                    });
                }
            };

            service.deleteAllControlsForCurrentScene = function() {
                let currentScene = getCurrentScene();
                if (currentScene) {

                    let deletedControlIds = currentScene.controls.map(c => c.id);

                    currentScene.controls = [];

                    service.saveProject(service.getCurrentProject());

                    if (currentProjectId !== activeProjectId) return;
                    backendCommunicator.fireEvent("controlsRemoved", {
                        sceneId: currentScene.id,
                        controlIds: deletedControlIds
                    });
                }
            };

            service.getControlsForCurrentScene = function() {
                let currentScene = getCurrentScene();
                if (currentScene) {
                    return currentScene.controls;
                }
                return [];
            };

            service.setSceneInCurrentProjectAsDefault = function(id) {
                let currentProject = service.getCurrentProject();
                if (currentProject != null) {
                    currentProject.defaultSceneId = id;
                    service.saveProject(currentProject);
                }
            };

            service.sceneIsDefaultForCurrentProject = function(id) {
                let currentProject = service.getCurrentProject();
                if (currentProject != null) {
                    return currentProject.defaultSceneId === id;
                }
                return false;
            };

            service.saveCooldownGroupsForCurrentProject = function(cooldownGroups) {
                let currentProject = service.getCurrentProject();
                if (currentProject != null && cooldownGroups != null) {
                    currentProject.cooldownGroups = cooldownGroups;
                    service.saveProject(currentProject);
                }
            };

            service.getControlDataForCurrentProject = function() {
                return service.getControlDataForProject(currentProjectId);
            };

            service.getControlDataForProject = function(projectId) {
                const project = service.getProjectById(projectId);
                if (project != null && project.scenes != null) {
                    // maps all scenes to array with control data arrays then flattens it to single array
                    const controls = [].concat.apply([], project.scenes
                        .filter(s => s.controls != null)
                        .map(s => s.controls.map(c => {
                            return {
                                sceneId: s.id,
                                sceneName: s.name,
                                controlId: c.id,
                                controlName: c.name,
                                controlKind: c.kind,
                                control: c
                            };
                        })));

                    return controls;
                }
                return [];
            };

            service.getProjects = function() {
                return projects;
            };

            service.hasAtLeastOneProject = function() {
                return projects.length > 0;
            };

            service.setSelectedScene = function(id) {
                selectedSceneId = id;
            };

            service.sceneIsSelected = function(id) {
                return id === selectedSceneId;
            };

            return service;
        });
}());
