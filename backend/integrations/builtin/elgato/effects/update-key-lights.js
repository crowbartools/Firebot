"use strict";

const { EffectCategory } = require("../../../../../shared/effect-constants");

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
        <eos-container ng-show="!hasKeylights">
            No key lights are connected currently.
        </eos-container>
        <eos-container ng-show="hasKeylights" header="Key Lights">
            <div ng-repeat="light in keyLights">
                <label class="control-fb control--checkbox">{{light.name}}
                    <input type="checkbox" ng-click="selectLight(light)" ng-checked="isLightSelected(light)" aria-label="..." >
                    <div class="control__indicator"></div>
                </label>
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
            return $scope.effect.selectedLights[light.name] != null && Object.keys($scope.effect.selectedLights[light.name]).length > 0;
        };

        $scope.selectLight = function(light) {
            if ($scope.isLightSelected(light)) {
                delete $scope.effect.selectedLights[light.name];
            } else {
                $scope.effect.selectedLights[light.name] = light;
            }
        };
    },
    optionsValidator: () => {},
    onTriggerEvent: async (event) => {
        const effect = event.effect;

    }
};

module.exports = effect;
