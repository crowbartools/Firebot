"use strict";

import { EffectScope, EffectType } from "../../../../../types/effects";
import hueManager from "../hue-manager";

export type HueControlLightEffectData = {
    lightId: string;
    updateActivated: boolean;
    activationAction?: "off" | "on" | "toggle";
    updateBrightness: boolean;
    brightnessPercentage?: string;
    updateColor: boolean;
    /**
     * Hex color string
     */
    color?: string;
    triggerEffectAnimation: boolean;
    effectAnimationType?: "colorloop" | "none";
    triggerAlert: boolean;
    alertType?: "short" | "long" | "disable";
    transitionType?: "default" | "instant" | "fast" | "slow" | "custom";
    customTransitionSecs?: string;
};

type HueLightData = {
    id: string;
    name: string;
    type: string;
    capabilities: {
        control?: {
            mindimlevel?: undefined,
            colorgamuttype?: "C",
            colorgamut?: [number, number][],
        }
    };
}

const model: EffectType<HueControlLightEffectData> = {
    definition: {
        id: "hue:control-light",
        name: "Control Hue Light",
        description: "Control a Philips Hue light",
        icon: "far fa-lightbulb fa-align-center",
        categories: ["integrations"],
        dependencies: []
    },
    optionsTemplate: `
        <eos-container header="Light">
            <firebot-searchable-select
                items="lights"
                ng-model="effect.lightId"
                on-select="onSelectLight()"
                placeholder="Search for light"
            />
        </eos-container>
        <eos-container header="Options" ng-if="selectedLight != null" pad-top="true">
            <firebot-checkbox
                label="Update Activated"
                model="effect.updateActivated"
            />
            <div ng-if="effect.updateActivated" class="ml-10 mb-3">
                <dropdown-select
                    options="activationOptions"
                    selected="effect.activationAction"
                />
            </div>
            <div ng-if="selectedLightCapabilities.dimming">
                <firebot-checkbox
                    label="Update Brightness"
                    model="effect.updateBrightness"
                />
                <div ng-if="effect.updateBrightness" class="ml-10 mb-3">
                    <firebot-input
                        input-title="Percentage (1-100)"
                        data-type="number"
                        model="effect.brightnessPercentage"
                        placeholder-text="Enter brightness percentage"
                    />
                </div>
            </div>
            <div ng-if="selectedLightCapabilities.color">
                <firebot-checkbox
                    label="Update Color"
                    model="effect.updateColor"
                />
                <div ng-if="effect.updateColor" class="ml-10 mb-3">
                    <color-picker-input
                        model="effect.color"
                    />
                </div>
            </div>
            <div ng-if="selectedLightCapabilities.dimming">
                <firebot-checkbox
                    label="Trigger Alert"
                    model="effect.triggerAlert"
                />
                <div ng-if="effect.triggerAlert" class="ml-10 mb-3">
                    <dropdown-select
                        options="alertTypeOptions"
                        selected="effect.alertType"
                    />
                </div>
            </div>
            <div ng-if="selectedLightCapabilities.color">
                <firebot-checkbox
                    label="Set Effect Animation"
                    model="effect.triggerEffectAnimation"
                />
                <div ng-if="effect.triggerEffectAnimation" class="ml-10 mb-3">
                    <dropdown-select
                        options="effectAnimationOptions"
                        selected="effect.effectAnimationType"
                    />
                </div>
            </div>
            <div>
                <h4>Transition</h4>
                <dropdown-select
                    options="transitionOptions"
                    selected="effect.transitionType"
                />
                <div ng-if="effect.transitionType == 'custom'" class="mt-3">
                    <firebot-input
                        input-title="Seconds"
                        data-type="number"
                        model="effect.customTransitionSecs"
                        placeholder-text="Enter seconds"
                    />
                </div>
            </div>
        </eos-container>
    `,
    optionsController: (
        $scope: EffectScope<HueControlLightEffectData> & {
            lights: HueLightData[];
            selectedLight?: HueLightData;
            selectedLightCapabilities: {
                color: boolean;
                dimming: boolean;
            }
        },
        backendCommunicator
    ) => {
        $scope.lights = [];

        $scope.selectedLight = null;
        $scope.selectedLightCapabilities = {
            color: false,
            dimming: false
        };

        function updateSelectedLight() {
            $scope.selectedLight = $scope.lights.find(l =>
                l.id === $scope.effect.lightId);
            $scope.selectedLightCapabilities = {
                color: $scope.selectedLight?.capabilities?.control?.colorgamuttype != null,
                dimming: $scope.selectedLight?.capabilities?.control?.mindimlevel != null
            };
        }

        backendCommunicator.fireEventAsync("getAllHueLights")
            .then((lights: HueLightData[]) => {
                $scope.lights = lights.map(l => ({
                    ...l,
                    description: l.type
                }));

                if ($scope.effect.lightId) {
                    updateSelectedLight();
                }
            });

        $scope.onSelectLight = updateSelectedLight;

        $scope.activationOptions = {
            off: "Off",
            on: "On",
            toggle: "Toggle"
        };

        $scope.transitionOptions = {
            default: "Default",
            instant: "Instant",
            fast: "Fast",
            slow: "Slow",
            custom: "Custom"
        };

        $scope.alertTypeOptions = {
            short: "Short",
            long: "Long",
            disable: "Disable"
        };

        $scope.effectAnimationOptions = {
            colorloop: "Color Loop",
            none: "None"
        };

        if ($scope.effect.transitionType == null) {
            $scope.effect.transitionType = "default";
        }
    },
    optionsValidator: (effect) => {
        if (!effect.lightId) {
            return ["Please select a light"];
        }

        if (effect.updateActivated && !effect.activationAction) {
            return ["Please select an activation action"];
        }

        if (effect.updateBrightness && !effect.brightnessPercentage) {
            return ["Please enter a brightness percentage"];
        }

        if (effect.updateColor && !effect.color) {
            return ["Please select a color"];
        }

        if (effect.triggerAlert && !effect.alertType) {
            return ["Please select an alert type"];
        }

        if (effect.triggerEffectAnimation && !effect.effectAnimationType) {
            return ["Please select an effect animation type"];
        }

        if (effect.transitionType === "custom" && (effect.customTransitionSecs == null || parseFloat(effect.customTransitionSecs) <= 0)) {
            return ["Please enter a custom transition time greater than 0"];
        }

        return [];
    },
    onTriggerEvent: async ({ effect }) => {
        hueManager.controlHueLight(effect.lightId, effect);
    }
};

module.exports = model;
