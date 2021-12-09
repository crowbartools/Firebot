"use strict";

const { EffectCategory } = require("../../../../../shared/effect-constants");
const { integration } = require("../elgato");

const effect = {
    definition: {
        id: "elgato:key-lights",
        name: "Update Elgato Key Lights",
        description: "Turn Elgato Key Lights on or off, and change the temperature and brightness.",
        icon: "far fa-rectangle-landscape fa-align-center",
        categories: [EffectCategory.INTEGRATIONS],
        dependencies: []
    },
    globalSettings: {},
    optionsTemplate: `
        <eos-container ng-if="!hasKeylights">
            No key lights are connected currently.
        </eos-container>
        <eos-container ng-if="hasKeylights" header="Key Lights">
            <div ng-repeat="light in keyLights">
                <label class="control-fb control--checkbox">{{light.name}}
                    <input type="checkbox" ng-click="selectLight(light)" ng-checked="isLightSelected(light)" aria-label="..." >
                    <div class="control__indicator"></div>
                </label>

                <div ng-if="isLightSelected(light)" class="ml-6 mb-10">
                    <label class="control-fb control--checkbox">Update enabled
                        <input type="checkbox" ng-click="selectEnabledOption(light)" ng-checked="isEnabledOptionSelected(light)" aria-label="..." >
                        <div class="control__indicator"></div>
                    </label>
                    <dropdown-select
                        ng-if="isEnabledOptionSelected(light)"
                        options="toggleOptions"
                        selected="effect.selectedLights[light.name].options.toggleType"
                    ></dropdown-select>
                </div>
            </div>
        </eos-container>
    `,
    optionsController: async ($scope, $q, backendCommunicator) => {
        $scope.hasKeylights = false;
        $scope.keyLights = [];

        if (!$scope.effect.selectedLights) {
            $scope.effect.selectedLights = {};
        }

        $q.when(backendCommunicator.fireEventAsync("getKeyLights"))
            .then(keyLights => {
                if (keyLights) {
                    $scope.keyLights = keyLights;

                    $scope.hasKeylights = true;
                }
            });

        $scope.isLightSelected = function(light) {
            return $scope.effect.selectedLights[light.name] != null;
        };

        $scope.selectLight = function(light) {
            if ($scope.isLightSelected(light)) {
                delete $scope.effect.selectedLights[light.name];
            } else {
                $scope.effect.selectedLights[light.name] = {
                    light: light,
                    options: {}
                };
            }
        };

        $scope.isEnabledOptionSelected = function(light) {
            if (!$scope.isLightSelected(light)) {
                return false;
            }
            return $scope.effect.selectedLights[light.name].options.toggleType != null;
        };

        $scope.selectEnabledOption = function(light) {
            if ($scope.isEnabledOptionSelected(light.name)) {
                delete $scope.effect.selectedLights[light.name].options.toggleType;
            } else {
                $scope.effect.selectedLights[light.name].options.toggleType = "disable";
            }
        };

        $scope.toggleOptions = {
            disable: "Deactivate",
            enable: "Activate",
            toggle: "Toggle"
        };
    },
    optionsValidator: (effect) => {
        let errors = [];
        if (Object.keys(effect.selectedLights).length === 0) {
            errors.push("Please select a key light.");
        }
        return errors;
    },
    onTriggerEvent: async (event) => {
        integration.updateKeyLights(Object.values(event.effect.selectedLights));

        return true;
    }
};

module.exports = effect;
