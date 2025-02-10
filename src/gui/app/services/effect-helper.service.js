"use strict";
(function() {
    // This provides helper methods for control effects

    angular
        .module("firebotApp")
        .factory("effectHelperService", function(backendCommunicator) {
            const service = {};

            const mapEffectDef = function(effectDef) {
                return {
                    definition: effectDef.definition,
                    optionsTemplate: effectDef.optionsTemplate,
                    optionsTemplateUrl: effectDef.optionsTemplateUrl,
                    optionsController: eval(effectDef.optionsControllerRaw), // eslint-disable-line no-eval
                    optionsValidator: eval(effectDef.optionsValidatorRaw), // eslint-disable-line no-eval
                    getDefaultLabel: effectDef.getDefaultLabelRaw ? eval(effectDef.getDefaultLabelRaw) : undefined // eslint-disable-line no-eval
                };
            };

            service.getEffectDefinition = function(id) {
                if (id == null) {
                    return null;
                }

                const effectDef = backendCommunicator.fireEventSync("getEffectDefinition", id);

                if (effectDef == null) {
                    return null;
                }

                return mapEffectDef(effectDef);
            };

            service.getAllEffectDefinitions = async function() {
                const effectDefs = (await backendCommunicator
                    .fireEventAsync("getAllEffectDefinitions")
                ).map(e => e.definition);

                return effectDefs;
            };

            service.getAllEffectTypes = async function() {
                const effectDefs = (await backendCommunicator
                    .fireEventAsync("getAllEffectDefinitions")
                ).map(mapEffectDef);

                return effectDefs;
            };

            // This is an object that will get passed into the scope of every effect type template
            // containing common options that appear in more than one effect
            service.commonOptionsForEffectTypes = {
                chatters: ["Streamer", "Bot"]
            };

            // This is used by effects that make use of lists of checkboxes. Returns and array of selected boxes.
            service.getCheckedBoxes = function(list, item) {
                let itemArray = list,
                    itemIndex;
                if (list == null || list instanceof Array === false) {
                    itemArray = [];
                }

                try {
                    itemIndex = itemArray.indexOf(item);
                } catch (err) {
                    itemIndex = -1;
                }

                if (itemIndex !== -1) {
                    // Item exists, so we're unchecking it.
                    itemArray.splice(itemIndex, 1);
                } else {
                    // Item doesn't exist! Add it in.
                    itemArray.push(item);
                }

                // Set new scope var.
                return itemArray;
            };

            // This is used to check for an item in a saved array and returns true if it exists.
            service.checkSavedArray = function(list, item) {
                if (list != null) {
                    return list.indexOf(item) !== -1;
                }
                return false;
            };

            return service;
        });
}());
