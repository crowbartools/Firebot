"use strict";

(function() {

    const profileManager = require("../../lib/common/profile-manager.js");

    angular
        .module("firebotApp")
        .factory("mixplayService", function($rootScope, backendCommunicator, logger) {
            let service = {};

            let projects = [];

            function loadProjects() {
                projects = backendCommunicator.fireEventSync("getAllProjects");
            }

            loadProjects();

            service.createNewProject = function(name) {
                let newProject = backendCommunicator.fireEventSync("createNewProject", name);
                projects.push(newProject);
            };

            service.getProjectById = function(id) {
                return projects.find(p => p.id === id);
            };

            service.getProjectNameAndIds = function() {
                return projects.map(p => {
                    return {
                        id: p.id,
                        name: p.name
                    };
                });
            };

            return service;
        });
}());
