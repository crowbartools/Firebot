"use strict";

(function() {
    angular
        .module("firebotApp")
        .factory("replaceVariableService", function(backendCommunicator) {
            const service = {};

            /**
             * @type {Array<import("../../../types/variables").ReplaceVariable['definition']>}
             */
            service.allVariables = backendCommunicator.fireEventSync("getReplaceVariableDefinitions");

            service.triggerCache = {};

            backendCommunicator.on("replace-variable-registered", (definition) => {
                service.allVariables.push(definition);
                service.triggerCache = {};
            });

            /**
             * @param {{ dataOutput: "number" | "text"; type: string; id: string; }} triggerData
             */
            service.getVariablesForTrigger = (triggerData) => {
                if (triggerData == null) {
                    return service.allVariables;
                }

                const cacheKey = [triggerData.type, triggerData.id, triggerData.dataOutput ?? "all"].join("::");

                if (service.triggerCache[cacheKey]) {
                    return service.triggerCache[cacheKey];
                }

                const filtered = service.allVariables.filter(v => {

                    if (triggerData.dataOutput === "number") {
                        if (v.possibleDataOutput == null || !v.possibleDataOutput.includes("number")) {
                            return false;
                        }
                    }

                    if (v.triggers == null) {
                        return true;
                    }

                    const variableTrigger = v.triggers[triggerData.type];
                    if (variableTrigger === true) {
                        return true;
                    }

                    if (Array.isArray(variableTrigger)) {
                        if (variableTrigger.some(id => id === triggerData.id)) {
                            return true;
                        }
                    }

                    return false;
                });

                service.triggerCache[cacheKey] = filtered;

                return filtered;
            };

            return service;
        });
}());
