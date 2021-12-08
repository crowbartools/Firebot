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
        <eos-container>
            <div class="btn-group" uib-dropdown>
                <button id="single-button" type="button" class="btn btn-default" uib-dropdown-toggle>
                    {{getSelectedKeyLight(effect.selectedKeyLight)}} <span class="caret"></span>
                </button>
                <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                    <li role="menuitem" ng-repeat="keyLight in keyLights" ng-click="effect.selectedKeyLight = keyLight.name">
                        <a href>{{keyLight.name}}</a>
                    </li>
                </ul>
            </div>

            <div ng-if="effect.selectedKeyLight">
                <div class="btn-group" uib-dropdown>
                    <button id="single-button" type="button" class="btn btn-default" uib-dropdown-toggle>
                        {{getSelectedKeyLight(effect.selectedKeyLight)}} <span class="caret"></span>
                    </button>
                    <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                        <li role="menuitem" ng-repeat="keyLight in keyLights" ng-click="effect.selectedKeyLight = keyLight.name">
                            <a href>{{keyLight.name}}</a>
                        </li>
                    </ul>
                </div>
            </div>
        </eos-container>
    `,
    optionsController: async ($scope, $q, backendCommunicator) => {
        $scope.keyLights = [];

        $q.when(backendCommunicator.fireEventAsync("getKeyLights"))
            .then(keyLights => {
                if (keyLights) {
                    $scope.keyLights = keyLights;
                }
            });

        $scope.getSelectedKeyLight = (selectedKeyLight) => {
            const keyLight = $scope.keyLights.find(kl => kl.name === selectedKeyLight);
            return keyLight ? keyLight.name : "Select one";
        };
    },
    optionsValidator: () => {},
    onTriggerEvent: async (event) => {
        const effect = event.effect;

    }
};

module.exports = effect;
