"use strict";

const effectManager = require("../../../../effects/effectManager");

exports.registerEffects = () => {
    const rollCredits = require("./roll-credits");
    const spinWheel = require("./spin-wheel");

    effectManager.registerEffect(rollCredits);
    effectManager.registerEffect(spinWheel);
};