"use strict";

(function() {
    angular
        .module("firebotApp")
        .factory("integrationService", function(
            $rootScope,
            settingsService,
            listenerService,
            backendCommunicator,
            utilityService
        ) {
            const service = {};

            let integrations = [];

            let integrationsWaitingForConnectionUpdate = [];

            function addIntegrationToWaitingConnection(id) {
                if (!integrationsWaitingForConnectionUpdate.includes(id)) {
                    integrationsWaitingForConnectionUpdate.push(id);
                }
            }

            function getIntegrationById(id) {
                return integrations.find(i => i.id === id);
            }

            service.updateIntegrations = function() {
                integrations = listenerService.fireEventSync(
                    "getAllIntegrationDefinitions"
                );
            };

            service.getIntegrations = function() {
                return integrations;
            };

            service.getLinkedIntegrations = function() {
                return service.getIntegrations().filter(i => i.linked && i.connectionToggle);
            };

            service.oneIntegrationIsLinked = function() {
                return integrations.some(i => i.linked && i.connectionToggle);
            };

            service.connectIntegration = function(id) {
                const integration = getIntegrationById(id);
                if (integration == null || integration.connected) {
                    return;
                }

                addIntegrationToWaitingConnection(id);
                listenerService.fireEvent("connectIntegration", id);
            };

            service.disconnectIntegration = function(id) {
                const integration = getIntegrationById(id);
                if (integration == null || !integration.connected) {
                    return;
                }

                addIntegrationToWaitingConnection(id);
                listenerService.fireEvent("disconnectIntegration", id);
            };

            service.toggleConnectionForIntegration = function(id) {
                const integration = getIntegrationById(id);
                if (integration == null || !integration.linked) {
                    return;
                }

                addIntegrationToWaitingConnection(id);
                if (integration.connected) {
                    service.disconnectIntegration(id);
                } else {
                    service.connectIntegration(id);
                }
            };

            service.setConnectionForIntegration = function(
                integrationId,
                shouldConnect
            ) {
                return new Promise(resolve => {
                    const listenerId = listenerService.registerListener(
                        {
                            type: listenerService.ListenerType.INTEGRATION_CONNECTION_UPDATE
                        },
                        data => {
                            if (data.id === integrationId) {
                                listenerService.unregisterListener(
                                    listenerService.ListenerType.INTEGRATION_CONNECTION_UPDATE,
                                    listenerId
                                );
                                resolve(data.connected);
                            }
                        }
                    );

                    if (shouldConnect) {
                        service.connectIntegration(integrationId);
                    } else {
                        service.disconnectIntegration(integrationId);
                    }
                });
            };

            service.integrationIsConnected = function(id) {
                const integration = getIntegrationById(id);
                if (integration == null) {
                    return false;
                }

                return integration.connected === true;
            };

            service.integrationIsLinked = function(id) {
                const integration = getIntegrationById(id);
                if (integration == null) {
                    return false;
                }

                return integration.linked === true;
            };

            service.integrationIsWaitingForConnectionUpdate = function(id) {
                return integrationsWaitingForConnectionUpdate.includes(id);
            };

            service.linkIntegration = function(id) {
                listenerService.fireEvent("linkIntegration", id);
            };

            service.unlinkIntegration = function(id) {
                listenerService.fireEvent("unlinkIntegration", id);
            };

            service.toggleLinkforIntegration = function(id) {
                if (service.integrationIsLinked(id)) {
                    service.unlinkIntegration(id);
                } else {
                    service.linkIntegration(id);
                }
            };

            service.openIntegrationSettings = function(id) {
                const integration = getIntegrationById(id);
                if (integration == null) {
                    return;
                }

                utilityService.showModal({
                    component: "editIntegrationUserSettingsModal",
                    windowClass: "no-padding-modal",
                    resolveObj: {
                        integration: () => integration
                    },
                    closeCallback: resp => {
                        const action = resp.action;

                        if (action === 'save') {

                            const updatedIntegration = resp.integration;
                            if (updatedIntegration == null) {
                                return;
                            }

                            const index = integrations.findIndex(i => i.id === updatedIntegration.id);
                            if (index > -1) {
                                integrations[index] = updatedIntegration;
                            }

                            backendCommunicator.send("integrationUserSettingsUpdate", updatedIntegration);
                        }
                    }
                });
            };

            listenerService.registerListener(
                {
                    type: listenerService.ListenerType.INTEGRATIONS_UPDATED
                },
                () => {
                    service.updateIntegrations();
                }
            );

            backendCommunicator.on("integrationLinked", (integration) => {
                if (integration == null || !integration.connectionToggle) {
                    return;
                }
                const sidebarControlledServices = settingsService.getSidebarControlledServices();
                const service = `integration.${integration.id}`;
                if (!sidebarControlledServices.includes(service)) {
                    sidebarControlledServices.push(service);
                }
                settingsService.setSidebarControlledServices(sidebarControlledServices);
            });

            backendCommunicator.on("integrationUnlinked", (intId) => {
                let sidebarControlledServices = settingsService.getSidebarControlledServices();
                const service = `integration.${intId}`;
                if (sidebarControlledServices.includes(service)) {
                    sidebarControlledServices = sidebarControlledServices.filter(s => s !== service);
                }
                settingsService.setSidebarControlledServices(sidebarControlledServices);
            });

            listenerService.registerListener(
                {
                    type: listenerService.ListenerType.INTEGRATION_CONNECTION_UPDATE
                },
                data => {
                    const integration = integrations.find(i => i.id === data.id);
                    if (integration != null) {
                        integration.connected = data.connected;
                    }

                    integrationsWaitingForConnectionUpdate = integrationsWaitingForConnectionUpdate.filter(
                        id => id !== data.id
                    );

                    $rootScope.$broadcast("connection:update", {
                        type: "integrations",
                        status: ""
                    });
                }
            );

            return service;
        });
}());
