"use strict";

const { EffectCategory } = require('../../../shared/effect-constants');

/** @type {import("../models/effectModels").Effect} */
const model = {
    definition: {
        id: "firebot:stop-effect-execution",
        name: "Stop Effect Execution",
        description: "Stop the execution of the current effect list.",
        icon: "fad fa-stop-circle",
        categories: [EffectCategory.SCRIPTING],
        dependencies: []
    },
    optionsTemplate: `
        <eos-container>
            <p>This effect will stop effect execution for the current effect list.</p>

            <div style="margin-top:15px">
                <label class="control-fb control--checkbox"> Bubble stop effect execution to parent effect lists <tooltip text="'Bubble the stop effect execution request to all parent effect lists (useful if this effect is nested within a conditional effect, etc)'"></tooltip>
                    <input type="checkbox" ng-model="effect.bubbleStop">
                    <div class="control__indicator"></div>
                </label>
            </div>
        </eos-container>
    `,
    optionsController: () => {},
    optionsValidator: () => {},
    onTriggerEvent: async event => {
        let { effect } = event;
        return {
            success: true,
            execution: {
                stop: true,
                bubbleStop: effect.bubbleStop === true
            }
        };
    }
};

module.exports = model;
