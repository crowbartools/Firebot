"use strict";

(function() {

    angular
        .module("firebotApp")
        .factory("startupScriptsService", function(backendCommunicator) {
            const service = {};

            let startupScripts = {};

            service.loadStartupScripts = async function() {
                const scripts = await backendCommunicator
                    .fireEventAsync("getStartupScripts");
                if (scripts != null) {
                    startupScripts = scripts;
                }
            };

            service.getStartupScripts = function() {
                return Object.values(startupScripts);
            };

            service.getStartupScriptData = function(startupScriptDataId) {
                return startupScripts[startupScriptDataId];
            };

            service.saveStartupScriptData = function(startupScriptData) {
                if (!startupScriptData) {
                    return;
                }

                startupScripts[startupScriptData.id] = startupScriptData;
                backendCommunicator.fireEvent("saveStartupScriptData",
                    startupScriptData);
            };

            service.deleteStartupScriptData = function(startupScriptDataId) {
                if (!startupScriptDataId) {
                    return;
                }

                delete startupScripts[startupScriptDataId];
                backendCommunicator.fireEvent("deleteStartupScriptData",
                    startupScriptDataId);
            };



            return service;
        });
}());