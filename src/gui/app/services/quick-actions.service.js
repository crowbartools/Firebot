"use strict";

/** @import { QuickActionDefinition } from "../../../types/quick-actions" */

(function() {
    angular
        .module("firebotApp")
        .factory("quickActionsService", function(
            settingsService,
            backendCommunicator,
            utilityService
        ) {
            const service = {};

            /** @type { Record<string, { enabled: boolean, position: number }> } */
            service.settings = settingsService.getSetting("QuickActions", true);

            /** @type {QuickActionDefinition[]} */
            service.quickActions = backendCommunicator.fireEventSync("quick-actions:get-quick-actions")
                .sort(
                    (a, b) => service.settings[a.id].position - service.settings[b.id].position
                ); ;

            backendCommunicator.on("quick-actions:all-quick-actions-updated", (/** @type {QuickActionDefinition[]} */ quickActions) => {
                if (quickActions != null) {
                    service.settings = settingsService.getSetting("QuickActions", true);
                    service.quickActions = quickActions.sort(
                        (a, b) => service.settings[a.id].position - service.settings[b.id].position
                    );
                }
            });

            backendCommunicator.on("trigger-quickaction:stream-info", () => {
                utilityService.showModal({
                    component: "editStreamInfoModal",
                    size: "md"
                });
            });

            backendCommunicator.on("trigger-quickaction:stream-schedule", () => {
                utilityService.showModal({
                    component: "streamScheduleModal",
                    size: "md"
                });
            });

            backendCommunicator.on("trigger-quickaction:give-currency", () => {
                utilityService.showModal({
                    component: "giveCurrencyModal",
                    size: "md"
                });
            });

            backendCommunicator.on("trigger-quickaction:reward-queue", () => {
                utilityService.showModal({
                    component: "rewardQueueModal",
                    size: "lg"
                });
            });

            /**
             * @param {string} quickActionId
             * @returns {QuickActionDefinition}
             */
            service.getQuickAction = (quickActionId) => {
                return service.quickActions.find(qa => qa.id === quickActionId);
            };

            /**
             * @param {QuickActionDefinition} customQuickAction
             * @returns {void}
             */
            service.saveCustomQuickAction = (customQuickAction) => {
                const savedCustomQuickAction = backendCommunicator.fireEventSync("quick-actions:save-custom-quick-action", customQuickAction);

                if (savedCustomQuickAction) {
                    return true;
                }

                return false;
            };

            /**
             * @returns {void}
             */
            service.saveQuickActionSettings = () => {
                settingsService.saveSetting("QuickActions", service.settings);
            };

            /**
             * @param {string} customQuickActionId
             * @returns {void}
             */
            service.deleteCustomQuickAction = (customQuickActionId) => {
                const action = service.quickActions.find(a => a.id === customQuickActionId);
                if (action) {
                    utilityService
                        .showConfirmationModal({
                            title: "Delete Custom Quick Action",
                            question: `Are you sure you want to delete the Custom Quick Action "${action.name}"?`,
                            confirmLabel: "Delete",
                            confirmBtnType: "btn-danger"
                        })
                        .then((confirmed) => {
                            if (confirmed) {
                                backendCommunicator.send("quick-actions:delete-custom-quick-action", customQuickActionId);
                            }
                        });
                }
            };

            /**
             * @param {QuickActionDefinition} [customQuickAction]
             * @returns {void}
             */
            service.showAddOrEditCustomQuickActionModal = (customQuickAction) => {
                utilityService.showModal({
                    component: "addOrEditCustomQuickActionModal",
                    size: "md",
                    resolveObj: {
                        quickAction: () => customQuickAction
                    }
                });
            };

            /**
             * @returns {void}
             */
            service.openQuickActionSettingsModal = () => {
                utilityService.showModal({
                    component: "quickActionSettingsModal",
                    size: "lg",
                    dismissCallback: () => {}
                });
            };

            /**
             * @param {string} customQuickActionId
             * @returns {void}
             */
            service.triggerQuickAction = (quickActionId) => {
                backendCommunicator.fireEvent("quick-actions:trigger-quick-action", quickActionId);
            };

            return service;
        });
}());