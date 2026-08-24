"use strict";

(function() {
    /** @typedef {import("../../../types").OverlayWidgetType} OverlayWidgetType */
    /** @typedef {import("../../../types").OverlayWidgetConfig} OverlayWidgetConfig */

    angular
        .module("firebotApp")
        .factory("overlayWidgetsService", function(backendCommunicator, modalService, objectCopyHelper, ngToast) {
            const service = {};

            /** @type {OverlayWidgetConfig[]} */
            service.overlayWidgetConfigs = [];

            /** @type {OverlayWidgetType[]} */
            service.overlayWidgetTypes = [];

            /**
             * @type {Object.<string, string | null>}
             */
            service.overlayWidgetStateDisplays = {};

            service.getOverlayWidgetType = (typeId) => {
                return service.overlayWidgetTypes.find(t => t.id === typeId);
            };

            /**
             * @param {OverlayWidgetConfig} config
             * @returns {void}
             */
            const updateWidgetConfig = (config) => {
                const index = service.overlayWidgetConfigs.findIndex(m => m.id === config.id);
                if (index > -1) {
                    service.overlayWidgetConfigs[index] = config;
                } else {
                    service.overlayWidgetConfigs.push(config);
                }
            };

            backendCommunicator.on("overlay-widget:types-updated", (overlayWidgetTypes) => {
                if (overlayWidgetTypes) {
                    service.overlayWidgetTypes = overlayWidgetTypes;
                }
            });

            backendCommunicator.on("overlay-widgets:configs-updated", (overlayWidgetConfigs) => {
                if (overlayWidgetConfigs) {
                    service.overlayWidgetConfigs = overlayWidgetConfigs;
                }
            });

            backendCommunicator.on("overlay-widgets:state-displays-updated", (stateDisplays) => {
                if (stateDisplays) {
                    service.overlayWidgetStateDisplays = stateDisplays;
                }
            });

            backendCommunicator.on("overlay-widgets:type-registered", (overlayWidgetType) => {
                if (overlayWidgetType) {
                    service.overlayWidgetTypes.push(overlayWidgetType);
                }
            });

            backendCommunicator.on("overlay-widgets:type-unregistered", ({ id }) => {
                service.overlayWidgetTypes = service.overlayWidgetTypes.filter(t => t.id !== id);
            });

            backendCommunicator.on("overlay-widgets:state-display-updated", ({ widgetId, stateDisplay }) => {
                service.overlayWidgetStateDisplays[widgetId] = stateDisplay;
            });

            /**
             * @param {string} widgetId
             * @returns {OverlayWidgetConfig}
             */
            service.getOverlayWidgetConfig = (widgetId) => {
                return service.overlayWidgetConfigs.find(w => w.id === widgetId);
            };

            /**
             * @param {string} name
             * @returns {OverlayWidgetConfig}
             */
            service.getOverlayWidgetConfigByName = (name) => {
                return service.overlayWidgetConfigs.find(w => w.name === name);
            };

            service.isOverlayWidgetNameValid = (name) => {
                return name != null && name.length > 0 && name.length <= 50;
            };

            service.getOverlayWidgetConfigsByType = (typeId) => {
                return service.overlayWidgetConfigs.filter(w => w.type === typeId);
            };

            service.getOverlayWidgetConfigsByTypes = (typeIds) => {
                return service.overlayWidgetConfigs.filter(w => typeIds.includes(w.type));
            };

            service.hasOverlayWidgetConfigsOfType = (typeId) => {
                return service.overlayWidgetConfigs.some(w => w.type === typeId);
            };

            service.hasOverlayWidgetConfigsOfTypes = (typeIds) => {
                return service.overlayWidgetConfigs.some(w => typeIds.includes(w.type));
            };

            /**
             * @param {OverlayWidgetConfig} config
             * @returns {void}
             */
            service.saveOverlayWidgetConfig = async (config, isNew = false) => {
                const copiedConfig = JSON.parse(angular.toJson(config));

                if (isNew) {
                    const widgetType = service.getOverlayWidgetType(config.type);
                    if (widgetType) {
                        copiedConfig.state = widgetType.initialState;
                    }
                }

                const savedConfig = await backendCommunicator.fireEventAsync(
                    isNew ? "overlay-widgets:save-new-config" : "overlay-widgets:save-config",
                    JSON.parse(angular.toJson(copiedConfig))
                );

                if (savedConfig) {
                    updateWidgetConfig(savedConfig);
                    return true;
                }

                return false;
            };

            service.saveAllOverlayWidgetConfigs = function(widgetConfigs) {
                service.overlayWidgetConfigs = widgetConfigs;
                backendCommunicator.send("overlay-widgets:save-all-configs", JSON.parse(angular.toJson(widgetConfigs)));
            };

            service.deleteOverlayWidgetConfig = function(widgetId) {
                service.overlayWidgetConfigs = service.overlayWidgetConfigs.filter(t => t.id !== widgetId);
                backendCommunicator.send("overlay-widgets:delete-config", widgetId);
            };

            service.toggleOverlayWidgetConfig = (widgetId) => {
                const widget = service.overlayWidgetConfigs.find(t => t.id === widgetId);
                if (widget == null) {
                    return;
                }

                widget.active = !widget.active;

                service.saveOverlayWidgetConfig(widget);
            };

            service.duplicateOverlayWidget = async (widgetId) => {
                const widget = service.overlayWidgetConfigs.find(t => t.id === widgetId);
                if (widget == null) {
                    return;
                }
                const copiedWidget = objectCopyHelper.copyObject("overlay widget", widget);
                copiedWidget.id = null;

                while (service.overlayWidgetConfigs.some(t => t.name === copiedWidget.name)) {
                    copiedWidget.name += " copy";
                }

                const successful = await service.saveOverlayWidgetConfig(copiedWidget, true);
                if (successful) {
                    ngToast.create({
                        className: 'success',
                        content: 'Successfully duplicated overlay widget!'
                    });
                } else {
                    ngToast.create("Unable to duplicate overlay widget.");
                }
            };

            /**
             * @param {OverlayWidgetConfig} [overlayWidgetConfig]
             * @returns {void}
             */
            service.showAddOrEditOverlayWidgetModal = (overlayWidgetConfig, closeCb) => {
                const dismiss = (widgetConfig) => {
                    backendCommunicator.send("overlay-widgets:stop-live-preview", widgetConfig);
                    if (closeCb) {
                        closeCb();
                    }
                };
                modalService.showModal({
                    component: "addOrEditOverlayWidgetModal",
                    size: "mdlg",
                    backdrop: false,
                    keyboard: false,
                    resolveObj: {
                        widget: () => overlayWidgetConfig
                    },
                    closeCallback: closeCb,
                    dismissCallback: () => dismiss(overlayWidgetConfig)
                });
            };

            service.triggerOverlayWidgetUIAction = (widgetId, actionId) => {
                backendCommunicator.send("overlay-widgets:trigger-ui-action", { widgetId, actionId });
            };

            backendCommunicator.send("overlay-widgets:ui-service-ready");

            return service;
        });
})();