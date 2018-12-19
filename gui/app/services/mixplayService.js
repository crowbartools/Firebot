"use strict";

(function() {

    const profileManager = require("../../lib/common/profile-manager.js");
    const uuidv1 = require("uuid/v1");

    angular
        .module("firebotApp")
        .factory("mixplayService", function($rootScope, backendCommunicator, logger, settingsService) {
            let service = {};

            let projects = [];
            let lastProjectId = settingsService.getLastMixplayProjectId();

            let selectedSceneId;


            service.getProjectById = function(id) {
                return projects.find(p => p.id === id);
            };

            service.getCurrentProject = function() {
                if (lastProjectId != null) {
                    return service.getProjectById(lastProjectId);
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

            function loadProjects() {
                projects = backendCommunicator.fireEventSync("getAllProjects");
                selectFirstScene();
            }

            loadProjects();

            service.createNewProject = function(name) {
                let newProject = backendCommunicator.fireEventSync("createNewProject", name);
                projects.push(newProject);
                lastProjectId = newProject.id;
            };

            service.saveProject = function(project) {
                // remove any angular fields
                let cleanedProject = JSON.parse(angular.toJson(project));

                backendCommunicator.fireEvent("saveProject", cleanedProject);
            };

            service.addNewSceneToCurrentProject = function(sceneName) {
                let currentProject = service.getCurrentProject();
                if (currentProject != null) {

                    let newId = uuidv1();

                    let newScene = {
                        id: newId,
                        name: sceneName,
                        assignedGroups: [],
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

            service.setCurrentProject = function(id) {
                lastProjectId = id;
                settingsService.setLastMixplayProjectId(id);
            };

            service.hasCurrentProject = function() {
                return lastProjectId != null;
            };

            service.deleteProject = function(id) {
                backendCommunicator.fireEvent("deleteProject", id);
                projects = projects.filter(p => p.id !== id);

                let lastProjectId = settingsService.getLastMixplayProjectId();
                if (lastProjectId === id) {
                    if (projects.length > 0) {
                        settingsService.setLastMixplayProjectId(projects[0].id);
                    } else {
                        settingsService.setLastMixplayProjectId(null);
                    }
                }
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
