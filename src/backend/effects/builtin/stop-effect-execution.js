"use strict";

const { EffectCategory } = require('../../../shared/effect-constants');

const { abortEffectList, abortEffect } = require("../../common/effect-abort-helpers");

const model = {
    definition: {
        id: "firebot:stop-effect-execution",
        name: "Stop Effect Execution",
        description: "Stop the execution of the current effect list.",
        icon: "fad fa-stop-circle",
        categories: [EffectCategory.SCRIPTING],
        dependencies: []
    },
    globalSettings: {},
    optionsTemplate: `
        <eos-container header="Target">
            <firebot-radios
                options="targetOptions"
                model="effect.target"
            />
            <div ng-if="effect.target === 'specificList'" class="mt-3">
                <firebot-input
                    input-title="Effect List ID"
                    title-tooltip="You can copy the ID of an effect list via its three-dot menu in the top right corner"
                    model="effect.listId"
                    placeholder-text="Enter ID"
                    data-type="text"
                />
            </div>
            <div ng-if="effect.target === 'specificEffect'" class="mt-3">
                <firebot-input
                    input-title="Effect ID"
                    title-tooltip="You can copy the ID of an effect via its three-dot menu"
                    model="effect.effectId"
                    placeholder-text="Enter ID"
                    data-type="text"
                />
            </div>
        </eos-container>


        <eos-container
            header="Options"
            ng-if="effect.target === 'currentList' || effect.target === 'specificList'"
            pad-top="true"
        >
            <firebot-checkbox
                label="Bubble to parent effect lists"
                tooltip="Bubble the stop effect execution request to all parent effect lists (useful if this effect is nested within a conditional effect, etc)"
                model="effect.bubbleStop"
            />
        </eos-container>
    `,
    optionsController: ($scope) => {
        $scope.targetOptions = {
            currentList: { text: "Current effect list", description: "Stops execution of the effect list that this effect resides in" },
            specificList: { text: "Specific list", description: "Abort the execution of a specific effect list by its ID" },
            specificEffect: { text: "Specific effect", description: "Abort the execution of a specific effect by its ID" }
        };

        if ($scope.effect.target == null) {
            $scope.effect.target = "currentList";
        }
    },
    optionsValidator: (effect) => {
        const errors = [];

        if (effect.target === "specificList" && !effect.listId) {
            errors.push("Please provide an effect list ID");
        }

        if (effect.target === "specificEffect" && !effect.effectId) {
            errors.push("Please provide an effect ID");
        }

        return errors;
    },
    onTriggerEvent: async event => {
        const { effect } = event;

        if (effect.target == null || effect.target === "currentList") {
            return {
                success: true,
                execution: {
                    stop: true,
                    bubbleStop: effect.bubbleStop === true
                }
            };
        }

        if (effect.target === "specificList") {
            abortEffectList(effect.listId, effect.bubbleStop === true);
        } else if (effect.target === "specificEffect") {
            abortEffect(effect.effectId);
        }

        return true;
    }
};

module.exports = model;
