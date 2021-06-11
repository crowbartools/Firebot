"use strict";

(function() {

    angular
        .module("firebotApp")
        .factory("presetEffectListsService", function($q, logger, backendCommunicator,
            utilityService) {
            let service = {};

            service.presetEffectLists = [];

            function updatePresetEffectList(presetList) {
                const index = service.presetEffectLists.findIndex(r => r.id === presetList.id);
                if (index > -1) {
                    service.presetEffectLists[index] = presetList;
                } else {
                    service.presetEffectLists.push(presetList);
                }
            }

            service.loadPresetEffectLists = async function() {
                $q.when(backendCommunicator.fireEventAsync("getPresetEffectLists"))
                    .then(presetEffectLists => {
                        if (presetEffectLists) {
                            service.presetEffectLists = Object.values(presetEffectLists);
                        }
                    });
            };

            backendCommunicator.on("all-preset-lists", presetEffectLists => {
                if (presetEffectLists != null) {
                    service.presetEffectLists = Object.values(presetEffectLists);
                }
            });

            service.getPresetEffectLists = function() {
                return Object.values(service.presetEffectLists);
            };

            service.getPresetEffectList = function(presetListId) {
                return service.presetEffectLists[presetListId];
            };

            service.savePresetEffectList = function(presetList) {
                return $q.when(backendCommunicator.fireEventAsync("savePresetEffectList", presetList))
                    .then(savedPresetList => {
                        if (savedPresetList) {
                            updatePresetEffectList(savedPresetList);
                            return true;
                        }
                        return false;
                    });
            };

            service.saveAllPresetEffectLists = (presetEffectLists) => {
                service.presetEffectLists = presetEffectLists;
                backendCommunicator.fireEvent("saveAllPresetEffectLists", presetEffectLists);
            };


            service.deletePresetEffectList = function(presetListId) {
                service.presetEffectLists = service.presetEffectLists.filter(cr => cr.id !== presetListId);
                backendCommunicator.fireEvent("deletePresetEffectList", presetListId);
            };

            service.showAddEditPresetEffectListModal = function(presetList) {
                utilityService.showModal({
                    component: "addOrEditPresetEffectListModal",
                    size: "md",
                    resolveObj: {
                        presetList: () => presetList
                    },
                    closeCallback: () => {}
                });
            };

            return service;
        });
}());