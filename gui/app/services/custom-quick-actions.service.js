"use strict";

(function() {

    angular
        .module("firebotApp")
        .factory("customQuickActionsService", function($q, backendCommunicator,
            utilityService, presetEffectListsService) {
            let service = {};

            service.customQuickActions = [];

            const addCustomQuickActionTrigger = (customQuickActions) => {
                customQuickActions.forEach(cqa => {
                    cqa.click = () => presetEffectListsService.manuallyTriggerPresetEffectList(cqa.presetListId);
                });

                return customQuickActions;
            };

            const updateCustomQuickActions = (customQuickAction) => {
                const index = service.customQuickActions.findIndex(cqa => cqa.id === customQuickAction.id);
                if (index > -1) {
                    service.customQuickActions[index] = customQuickAction;
                } else {
                    service.customQuickActions.push(customQuickAction);
                }
            };

            service.loadCustomQuickActions = async () => {
                const customQuickActions = await backendCommunicator.fireEventAsync("getCustomQuickActions");

                if (customQuickActions) {
                    service.customQuickActions = Object.values(customQuickActions);
                }
            };
            service.loadCustomQuickActions();

            backendCommunicator.on("all-custom-quick-actions", customQuickActions => {
                if (customQuickActions != null) {
                    service.customQuickActions = Object.values(customQuickActions);
                }
            });

            service.getCustomQuickActions = async () => {
                if (!service.customQuickActions || !service.customQuickActions.length) {
                    await service.loadCustomQuickActions();
                }

                return addCustomQuickActionTrigger(service.customQuickActions) || [];
            };

            service.getCustomQuickAction = (customQuickActionId) => {
                return service.customQuickActions.find(cqa => cqa.id === customQuickActionId);
            };

            service.saveCustomQuickAction = (customQuickAction) => {
                return $q.when(backendCommunicator.fireEventAsync("saveCustomQuickAction", customQuickAction))
                    .then(savedCustomQuickAction => {
                        if (savedCustomQuickAction) {
                            updateCustomQuickActions(savedCustomQuickAction);
                            return true;
                        }
                        return false;
                    });
            };

            service.deleteCustomQuickAction = (customQuickActionId) => {
                service.customQuickActions = service.customQuickActions.filter(cqa => cqa.id !== customQuickActionId);
                backendCommunicator.fireEvent("deleteCustomQuickAction", customQuickActionId);
            };

            service.showAddOrEditCustomQuickActionModal = (quickAction) => {
                utilityService.showModal({
                    component: "addOrEditCustomQuickActionModal",
                    size: "md",
                    resolveObj: {
                        quickAction: () => quickAction
                    }
                });
            };

            return service;
        });
}());