"use strict";

const effectManager = require("../../../../effects/effectManager");

exports.registerEffects = () => {
    const hueScenes = require("./hue-scenes");

    effectManager.registerEffect(hueScenes);
};