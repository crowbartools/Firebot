"use strict";

const effectManager = require("../../../../effects/effectManager");

exports.registerEffects = () => {
    effectManager.registerEffect(require("./roll-credits"));
    effectManager.registerEffect(require("./spin-wheel"));
};