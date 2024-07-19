"use strict";

(function() {

    angular
        .module("firebotApp")
        .factory("presetEffectListsService", function($q, backendCommunicator,
            utilityService, objectCopyHelper, ngToast) {
            const service = {};

            service.presetEffectLists = [];

            function updatePresetEffectList(presetEffectList) {
                const index = service.presetEffectLists.findIndex(pel => pel.id === presetEffectList.id);
                if (index > -1) {
                    service.presetEffectLists[index] = presetEffectList;
                } else {
                    service.presetEffectLists.push(presetEffectList);
                }
            }

            service.loadPresetEffectLists = async function() {
                $q.when(backendCommunicator.fireEventAsync("getPresetEffectLists"))
                    .then(presetEffectLists => {
                        if (presetEffectLists) {
                            service.presetEffectLists = presetEffectLists;
                        }
                    });
            };

            backendCommunicator.on("all-preset-lists", presetEffectLists => {
                if (presetEffectLists != null) {
                    service.presetEffectLists = presetEffectLists;
                }
            });

            service.getPresetEffectLists = function() {
                return service.presetEffectLists;
            };

            service.getPresetEffectList = function(presetEffectListId) {
                return service.presetEffectLists.find(pel => pel.id === presetEffectListId);
            };

            service.savePresetEffectList = function(presetEffectList) {
                return $q.when(backendCommunicator.fireEventAsync("savePresetEffectList", presetEffectList))
                    .then(savedPresetEffectList => {
                        if (savedPresetEffectList) {
                            updatePresetEffectList(savedPresetEffectList);
                            return savedPresetEffectList;
                        }
                        return null;
                    });
            };

            service.saveAllPresetEffectLists = (presetEffectLists) => {
                service.presetEffectLists = presetEffectLists;
                backendCommunicator.fireEvent("saveAllPresetEffectLists", presetEffectLists);
            };

            service.presetEffectListNameExists = (name) => {
                return service.presetEffectLists.some(pel => pel.name === name);
            };

            service.showRunPresetListModal = (id, isQuickAction = false) => {
                const list = service.getPresetEffectList(id);
                if (list == null) {
                    return;
                }

                if (list.args?.length < 1) {
                    service.manuallyTriggerPresetEffectList(id);
                    if (!isQuickAction) {
                        ngToast.create({
                            className: 'success',
                            content: `Ran "${list.name}"!`
                        });
                    }
                    return;
                }

                utilityService.showModal({
                    component: "triggerPresetEffectListModal",
                    size: "md",
                    resolveObj: {
                        presetEffectList: () => list,
                        isQuickAction: () => isQuickAction
                    }
                });
            };

            backendCommunicator.on("show-run-preset-list-modal", (id) => {
                service.showRunPresetListModal(id, true);
            });

            service.manuallyTriggerPresetEffectList = (presetEffectListId, args, isQuickAction) => {
                const presetEffectList = service.presetEffectLists.find(pel => pel.id === presetEffectListId);
                ipcRenderer.send('runEffectsManually', {
                    effects: presetEffectList.effects,
                    metadata: args ? { presetListArgs: args } : undefined,
                    triggerType: isQuickAction ? "quick_action" : undefined
                });
            };

            service.duplicatePresetEffectList = (presetEffectListId) => {
                const presetEffectList = service.presetEffectLists.find(pel => pel.id === presetEffectListId);
                if (presetEffectList == null) {
                    return;
                }
                const copiedPresetEffectList = objectCopyHelper.copyObject("preset_effect_list", presetEffectList);
                copiedPresetEffectList.id = null;

                while (service.presetEffectListNameExists(copiedPresetEffectList.name)) {
                    copiedPresetEffectList.name += " copy";
                }

                service.savePresetEffectList(copiedPresetEffectList).then((savedList) => {
                    if (savedList != null) {
                        ngToast.create({
                            className: 'success',
                            content: 'Successfully duplicated a preset effect list!'
                        });
                    } else {
                        ngToast.create("Unable to duplicate preset effect list.");
                    }
                });
            };

            service.deletePresetEffectList = function(presetEffectListId) {
                service.presetEffectLists = service.presetEffectLists.filter(pel => pel.id !== presetEffectListId);
                backendCommunicator.fireEvent("deletePresetEffectList", presetEffectListId);
            };

            service.showAddEditPresetEffectListModal = function(presetEffectList) {
                return new Promise((resolve) => {
                    utilityService.showModal({
                        component: "addOrEditPresetEffectListModal",
                        size: "md",
                        resolveObj: {
                            presetList: () => presetEffectList
                        },
                        closeCallback: (response) => {
                            resolve(response.presetEffectList);
                        },
                        dismissCallback: () => {
                            resolve(null);
                        }
                    });
                });
            };

            return service;
        });
}());