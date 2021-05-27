"use strict";

(function() {

    angular
        .module("firebotApp")
        .factory("presetEffectListsService", function($q, logger, backendCommunicator,
            utilityService) {
            let service = {};

            let presetEffectLists = {};
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
                const presetLists = await backendCommunicator
                    .fireEventAsync("getPresetEffectLists");
                if (presetLists != null) {
                    presetEffectLists = presetLists;
                    service.presetEffectLists = Object.values(presetLists);
                }
            };

            backendCommunicator.on("all-preset-lists", presetLists => {
                if (presetLists != null) {
                    presetEffectLists = presetLists;
                    service.presetEffectLists = Object.values(presetEffectLists);
                }
            });

            service.getPresetEffectLists = function() {
                return Object.values(presetEffectLists);
            };

            service.getPresetEffectList = function(presetListId) {
                return presetEffectLists[presetListId];
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

            service.showAddEditPresetEffectListModal = function(presetListId, hideDeleteButton = false) {
                return new Promise(resolve => {
                    let presetList;
                    if (presetListId != null) {
                        presetList = service.getPresetEffectList(presetListId);
                    }

                    utilityService.showModal({
                        component: "addOrEditPresetEffectListModal",
                        resolveObj: {
                            presetList: () => presetList,
                            hideDeleteButton: () => hideDeleteButton
                        },
                        dismissCallback: () => {
                            resolve(null);
                        },
                        closeCallback: resp => {
                            let { presetList, action } = resp;

                            switch (action) {
                            case "delete":
                                service.deletePresetEffectList(presetList.id);
                                break;
                            default:
                                service.savePresetEffectList(presetList);
                            }

                            resolve(presetList);
                        }
                    });
                });
            };

            return service;
        });
}());