"use strict";

const {handleDiceEffect} = require("../../common/handlers/diceProcessor");
const { EffectDependency } = require("../models/effectModels");
const { EffectCategory } = require('../../../shared/effect-constants');

const model = {
    definition: {
        id: "firebot:dice",
        name: "Roll Dice",
        description: "Specify an amount of dice to roll in chat.",
        icon: "fad fa-dice",
        categories: [EffectCategory.FUN, EffectCategory.CHAT_BASED],
        dependencies: [EffectDependency.CHAT]
    },
    optionsTemplate: `
        <eos-container header="Roll">
            <firebot-input
                input-title="Dice"
                model="effect.dice"
                placeholder-text="2d20 or 2d10+1d12 or 1d10+3"
            />
        </eos-container>

        <eos-container header="Display Mode" pad-top="true">
            <firebot-radios
                options="displayModeOptions"
                model="effect.resultType"
            />
        </eos-container>

        <eos-chatter-select effect="effect" title="Announce Roll As" pad-top="true"></eos-chatter-select>
    `,
    optionsController: $scope => {
        $scope.displayModeOptions = {
            sum: { text: "Just the sum", description: "Ex: 'ebiggz rolled a 7 on 2d6.'" },
            individual: { text: "Include each roll", description: "Ex: 'ebiggz rolled a 7 (4, 3) on 2d6.'"}
        };

        $scope.effect.resultType = $scope.effect.resultType
            ? $scope.effect.resultType
            : "sum";
    },
    optionsValidator: effect => {
        const errors = [];
        if (!effect.dice) {
            errors.push("Please input the number of dice you'd like to roll.");
        }
        return errors;
    },
    onTriggerEvent: async ({ effect, trigger }) => {
        handleDiceEffect(effect, trigger);
        return true;
    }
};

module.exports = model;
