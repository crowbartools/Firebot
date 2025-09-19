"use strict";

(function() {
    /** @typedef {import("../../../types/overlay-widgets").OverlayWidgetType} OverlayWidgetType */
    /** @typedef {import("../../../types/overlay-widgets").OverlayWidgetConfig} OverlayWidgetConfig */

    angular
        .module("firebotApp")
        .factory("overlayWidgetsService", function(backendCommunicator, modalService, objectCopyHelper, ngToast) {
            const service = {};

            /** @type {OverlayWidgetConfig[]} */
            service.overlayWidgetConfigs = [];

            /** @type {OverlayWidgetType[]} */
            service.overlayWidgetTypes = [];

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

            service.loadOverlayWidgetTypesAndConfigs = async () => {
                const overlayWidgetTypes = await backendCommunicator.fireEventAsync("overlay-widgets:get-all-types");
                if (overlayWidgetTypes) {
                    service.overlayWidgetTypes = overlayWidgetTypes;
                }

                const overlayWidgetConfigs = await backendCommunicator.fireEventAsync("overlay-widgets:get-all-configs");
                if (overlayWidgetConfigs) {
                    service.overlayWidgetConfigs = overlayWidgetConfigs;
                }
            };

            backendCommunicator.on("overlay-widgets:configs-updated", () => {
                service.loadOverlayWidgetTypesAndConfigs();
            });

            backendCommunicator.on("overlay-widgets:type-registered", (overlayWidgetType) => {
                if (overlayWidgetType) {
                    service.overlayWidgetTypes.push(overlayWidgetType);
                }
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

            /**
             * @param {OverlayWidgetConfig} config
             * @returns {Promise.<void>}
             */
            service.saveOverlayWidgetConfig = async (config) => {
                const savedConfig = await backendCommunicator.fireEventAsync("overlay-widgets:save-config", JSON.parse(angular.toJson(config)));

                if (savedConfig) {
                    updateWidgetConfig(savedConfig);
                    return true;
                }

                return false;
            };

            service.saveAllOverlayWidgetConfigs = function(widgetConfigs) {
                service.overlayWidgetConfigs = widgetConfigs;
                backendCommunicator.fireEvent("overlay-widgets:save-all-configs", JSON.parse(angular.toJson(widgetConfigs)));
            };

            service.deleteOverlayWidgetConfig = function(widgetId) {
                service.overlayWidgetConfigs = service.overlayWidgetConfigs.filter(t => t.id !== widgetId);
                backendCommunicator.fireEvent("overlay-widgets:delete-config", widgetId);
            };

            service.toggleOverlayWidgetConfig = (widgetId) => {
                const widget = service.overlayWidgetConfigs.find(t => t.id === widgetId);
                if (widget == null) {
                    return;
                }

                widget.active = !widget.active;

                service.saveOverlayWidgetConfig(widget);
            };

            service.duplicateOverlayWidget = (widgetId) => {
                const widget = service.overlayWidgetConfigs.find(t => t.id === widgetId);
                if (widget == null) {
                    return;
                }
                const copiedWidget = objectCopyHelper.copyObject("overlay widget", widget);
                copiedWidget.id = null;

                while (service.overlayWidgetConfigs.some(t => t.name === copiedWidget.name)) {
                    copiedWidget.name += " copy";
                }

                service.saveOverlayWidgetConfig(copiedWidget)
                    .then((successful) => {
                        if (successful) {
                            ngToast.create({
                                className: 'success',
                                content: 'Successfully duplicated overlay widget!'
                            });
                        } else {
                            ngToast.create("Unable to duplicate overlay widget.");
                        }
                    });
            };

            /**
             * @param {OverlayWidgetConfig} [overlayWidgetConfig]
             * @returns {void}
             */
            service.showAddOrEditOverlayWidgetModal = (overlayWidgetConfig, closeCb) => {
                modalService.showModal({
                    component: "addOrEditOverlayWidgetModal",
                    size: "md",
                    resolveObj: {
                        widget: () => overlayWidgetConfig
                    },
                    closeCallback: closeCb,
                    dismissCallback: closeCb
                });
            };

            return service;
        });
})();