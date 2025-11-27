"use strict";

const { EffectManager } = require("../../../../effects/effect-manager");

exports.registerEffects = () => {
    const rollCredits = require("./roll-credits");
    const spinWheel = require("./spin-wheel");

    EffectManager.registerEffect(rollCredits);
    EffectManager.registerEffect(spinWheel);
};