"use strict";

(function() {

    const profileManager = require("../../lib/common/profile-manager.js");

    angular
        .module("firebotApp")
        .factory("mixplayService", function($rootScope, backendCommunicator, logger, settingsService) {
            let service = {};

            let projects = [];
            let lastProjectId = settingsService.getLastMixplayProjectId();

            function loadProjects() {
                projects = backendCommunicator.fireEventSync("getAllProjects");
                console.log(projects);
            }

            loadProjects();

            service.createNewProject = function(name) {
                let newProject = backendCommunicator.fireEventSync("createNewProject", name);
                projects.push(newProject);
                lastProjectId = newProject.id;
            };

            service.getCurrentProject = function() {
                if (lastProjectId != null) {
                    return service.getProjectById(lastProjectId);
                }
                return null;
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

            service.getProjectById = function(id) {
                return projects.find(p => p.id === id);
            };

            service.getProjects = function() {
                return projects;
            };

            service.hasAtLeastOneProject = function() {
                return projects.length > 0;
            };

            return service;
        });
}());
