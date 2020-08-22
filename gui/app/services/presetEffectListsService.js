"use strict";

(function() {

    angular
        .module("firebotApp")
        .factory("presetEffectListsService", function(logger, backendCommunicator,
            utilityService) {
            let service = {};

            let presetEffectLists = {};

            service.loadPresetEffectLists = async function() {
                const presetLists = await backendCommunicator
                    .fireEventAsync("getPresetEffectLists");
                if (presetLists != null) {
                    presetEffectLists = presetLists;
                }
            };

            service.getPresetEffectLists = function() {
                return Object.values(presetEffectLists);
            };

            service.getPresetEffectList = function(presetListId) {
                return presetEffectLists[presetListId];
            };

            service.savePresetEffectList = function(presetList) {
                if (!presetList) return;
                presetEffectLists[presetList.id] = presetList;
                backendCommunicator.fireEvent("savePresetEffectList", presetList);
            };

            service.deletePresetEffectList = function(presetListId) {
                if (!presetListId) return;
                delete presetEffectLists[presetListId];
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

            service.showDeletePresetEffectListModal = function(presetListId) {
                if (presetListId == null) return Promise.resolve(false);

                const presetList = service.getPresetEffectList(presetListId);
                if (presetList == null) return Promise.resolve(false);

                return utilityService
                    .showConfirmationModal({
                        title: "Delete Preset Effect List",
                        question: `Are you sure you want to delete the preset effect list "${presetList.name}"?`,
                        confirmLabel: "Delete",
                        confirmBtnType: "btn-danger"
                    })
                    .then(confirmed => {
                        if (confirmed) {
                            service.deletePresetEffectList(presetListId);
                        }
                        return confirmed;
                    });
            };

            return service;
        });
}());