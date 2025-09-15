"use strict";

const { EffectCategory } = require('../../../shared/effect-constants');

const toggleConnection = {
    definition: {
        id: "firebot:toggleconnection",
        name: "Toggle Connection",
        description: "Toggle connection to Twitch and any linked Integrations",
        icon: "fad fa-plug",
        categories: [EffectCategory.ADVANCED],
        dependencies: []
    },
    globalSettings: {},
    optionsTemplate: `
        <eos-container header="Mode">
            <div style="padding-left: 10px;">
                <label class="control-fb control--radio">All Connections <span class="muted"><br />Update all connections (Twitch and any linked integrations)</span>
                    <input type="radio" ng-model="effect.mode" value="all"/>
                    <div class="control__indicator"></div>
                </label>
                <label class="control-fb control--radio" >Custom Connections <span class="muted"><br />Pick and choose which connections to update</span>
                    <input type="radio" ng-model="effect.mode" value="custom"/>
                    <div class="control__indicator"></div>
                </label>
            </div>
        </eos-container>

        <eos-container ng-show="effect.mode === 'all'" header="Action" pad-top="true">
            <dropdown-select options="{ toggle: 'Toggle', true: 'Connect', false: 'Disconnect'}" selected="effect.allAction"></dropdown-select>
        </eos-container>

        <eos-container ng-show="effect.mode === 'custom'" header="Connections" pad-top="true">
            <div ng-repeat="service in services">
                <label class="control-fb control--checkbox">{{service.name}}
                    <input type="checkbox" ng-click="toggleServiceSelected(service.id)" ng-checked="serviceIsSelected(service.id)"  aria-label="Toggle {{service.name}}" >
                    <div class="control__indicator"></div>
                </label>
                <div ng-show="serviceIsSelected(service.id)" style="margin-bottom: 15px;">
                    <div class="btn-group" uib-dropdown>
                        <button id="single-button" type="button" class="btn btn-default" uib-dropdown-toggle>
                        {{getConnectionActionDisplay(service.id)}} <span class="caret"></span>
                        </button>
                        <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                            <li role="menuitem" ng-click="setConnectionAction(service.id, true)"><a href>Connect</a></li>
                            <li role="menuitem" ng-click="setConnectionAction(service.id, false)"><a href>Disconnect</a></li>
                            <li role="menuitem" ng-click="setConnectionAction(service.id, 'toggle')"><a href>Toggle</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </eos-container>
    `,
    optionsController: ($scope, integrationService) => {

        if ($scope.effect.allAction == null) {
            $scope.effect.allAction = "toggle";
        }

        $scope.services = [
            {
                id: "chat",
                name: "Twitch"
            },
            ...integrationService.getLinkedIntegrations().map(i => ({
                id: `integration.${i.id}`,
                name: i.name
            }))
        ];

        if ($scope.effect.services == null) {
            $scope.effect.services = [];
        }

        $scope.serviceIsSelected = serviceId => $scope.effect.services.some(s => s.id === serviceId);

        $scope.toggleServiceSelected = (serviceId) => {
            if ($scope.serviceIsSelected(serviceId)) {
                $scope.effect.services = $scope.effect.services.filter(
                    s => s.id !== serviceId
                );
            } else {
                $scope.effect.services.push({
                    id: serviceId,
                    action: 'toggle'
                });
            }
        };

        $scope.setConnectionAction = (
            serviceId,
            action
        ) => {
            const service = $scope.effect.services.find(
                s => s.id === serviceId
            );
            if (service != null) {
                service.action = action;
            }
        };

        $scope.getConnectionActionDisplay = (serviceId) => {
            const service = $scope.effect.services.find(
                s => s.id === serviceId
            );
            if (service == null) {
                return "";
            }

            if (service.action === "toggle") {
                return "Toggle";
            }
            if (service.action === true) {
                return "Connect";
            }
            return "Disconnect";
        };


    },
    optionsValidator: (effect) => {
        const errors = [];
        if (effect.mode == null) {
            errors.push("Please select a mode.");
        } else if (effect.mode === "custom" && (effect.services == null || effect.services.length < 1)) {
            errors.push("Please select at least one connection to update");
        }

        return errors;
    },
    getDefaultLabel: (effect) => {
        const action = effect.allAction === "toggle" ? "Toggle"
            : effect.allAction === "true" ? "Connect" : "Disconnect";
        if (effect.mode === "all") {
            return `${action} all connections`;
        }

        return `Update ${effect.services.length} connection${effect.services.length === 1 ? "" : "s"}`;
    },
    onTriggerEvent: async ({ effect }) => {
        const connectionManager = require("../../common/connection-manager");
        const integrationManager = require("../../integrations/integration-manager");

        let services;
        // here for backwards compat, just toggle twitch
        if (effect.mode == null) {
            services = [
                {
                    id: "chat",
                    action: "toggle"
                }
            ];
        } else {
            if (effect.mode === "all") {

                services = [
                    {
                        id: "chat",
                        action: effect.allAction
                    },
                    ...integrationManager
                        .getAllIntegrationDefinitions()
                        .filter(i => integrationManager.integrationIsConnectable(i.id))
                        .map(i => ({
                            id: `integration.${i.id}`,
                            action: effect.allAction
                        }))
                ];
            } else if (effect.mode === "custom") {
                services = effect.services;
            }
        }

        await connectionManager.updateConnectionForServices(services);
    }
};

module.exports = toggleConnection;
